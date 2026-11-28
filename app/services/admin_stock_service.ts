import { generateFixedSKU } from '#common/sku_generator';
import {
  ConflictException,
  DomainRuleException,
  InternalServerException,
  NotFoundException,
  PreconditionFailedException,
} from '#exceptions/domain_exception';
import AdminStockDataMapper from '#mappers/stock/admin_stock_data_mapper';
import PaginationDataMapper from '#mappers/pagination_data_mapper';
import StockDataMapper from '#mappers/stock/stock_data_mapper';
import Stock from '#models/stock';
import {
  AdminStockItemDataDto,
  AdminStockItemSummaryDto,
  StockItemCreateDto,
  StockItemCreatedDto,
  StockItemUpdateDto,
} from '#types/stock';
import db from '@adonisjs/lucid/services/db';
import { randomUUID } from 'node:crypto';
import { PaginationQuery } from '#types/pagination';
import paginationConfig from '#config/pagination';
import { stockSortColumns } from '#common/pagination';
import { DateTime } from 'luxon';

export default class AdminStockService {
  private adminStockDataMapper = new AdminStockDataMapper();
  private stockDataMapper = new StockDataMapper();
  private paginationDataMapper = new PaginationDataMapper();

  async fetchAllStocks(pagination: PaginationQuery) {
    const page = pagination.page ?? paginationConfig.defaultPage;
    const perPage = pagination.perPage ?? paginationConfig.defaultPerPage;
    const [sortField, sortDirection] = (pagination.sort ?? 'name:asc').split(':');
    const sortColumn = stockSortColumns[sortField];
    if (!sortColumn || (sortDirection !== 'asc' && sortDirection !== 'desc')) {
      throw new DomainRuleException('Invalid stock pagination sort', [
        { field: 'sort', rule: 'enum', message: 'Invalid sort field or direction' },
      ]);
    }

    return db.transaction(
      async (trx) => {
        const paginator = await Stock.query({ client: trx })
          .where('available_qty', '>=', 0)
          .orderBy(sortColumn, sortDirection)
          .orderBy('id', 'asc')
          .preload('photos', (query) => query.orderBy('id'))
          .preload('prices', (query) => query.orderBy('id'))
          .paginate(page, perPage);
        const stocks: Array<AdminStockItemSummaryDto> =
          this.adminStockDataMapper.mapStockModelToAdminStockItemSummary(paginator.all());
        const meta = paginator.getMeta();
        return this.paginationDataMapper.map(stocks, meta.currentPage, meta.perPage, meta.total);
      },
      { isolationLevel: 'repeatable read' }
    );
  }

  async fetchSingleStockItem(itemId: string): Promise<AdminStockItemDataDto> {
    return db.transaction(
      async (trx) => {
        const stock = await Stock.query({ client: trx })
          .where('item_id', itemId)
          .where('available_qty', '>=', 0)
          .first();
        if (!stock) {
          throw new NotFoundException(`Stock item ${itemId} not found`);
        }
        await stock.load('photos', (query) => query.orderBy('id'));
        await stock.load('prices', (query) => query.orderBy('id'));
        return this.adminStockDataMapper.mapStockModelToAdminStockItem(stock);
      },
      { isolationLevel: 'repeatable read' }
    );
  }

  async createSingleItemStock(stock: StockItemCreateDto): Promise<StockItemCreatedDto> {
    const itemId = stock.itemId ?? randomUUID();
    stock.itemId = itemId;
    if (await Stock.findBy({ itemId })) {
      throw new ConflictException(`Stock item = ${itemId} already exists`);
    }
    const sku = generateFixedSKU(stock.name, stock.color, stock.size);
    if (await Stock.findBy({ sku })) {
      throw new ConflictException(`SKU ${sku} already exists`);
    }
    const createdStockItemId = await db.transaction(async (trx) => {
      const stockModel = this.stockDataMapper.mapStockItemCreateDtoToStockModel(stock, sku);
      const { photos, prices, ...stockHead } = stockModel;
      const savedStockHead = await Stock.create(stockHead, { client: trx });
      const savedStockPhotos = await savedStockHead.related('photos').createMany(photos);
      const savedStockPrices = await savedStockHead.related('prices').createMany(prices);

      if (!savedStockHead || !savedStockPhotos || !savedStockPrices) {
        throw new InternalServerException(`Could not create new stock item = ${itemId}`);
      }

      return savedStockHead.itemId;
    });
    return { itemId: createdStockItemId };
  }

  async updateSingleItemStock(
    itemId: string,
    update: StockItemUpdateDto,
    expectedVersion: number
  ): Promise<AdminStockItemDataDto> {
    return db.transaction(async (trx) => {
      const stock = await Stock.query({ client: trx })
        .where('item_id', itemId)
        .whereNull('deleted_at')
        .forUpdate()
        .first();
      if (!stock) {
        throw new NotFoundException(`Stock item ${itemId} not found`);
      }
      if (stock.version !== expectedVersion) {
        throw new PreconditionFailedException('Stock version is stale');
      }

      const { photos, prices, ...attributes } = update;
      await stock.load('photos', (query) => query.orderBy('id'));
      await stock.load('prices', (query) => query.orderBy('id'));
      const { attributesChanged, photosChanged, pricesChanged } = this.getStockChanges(
        stock,
        update
      );
      if (!attributesChanged && !photosChanged && !pricesChanged) {
        return this.adminStockDataMapper.mapStockModelToAdminStockItem(stock);
      }
      const affected = await trx
        .knexQuery()
        .from('stocks')
        .where('id', stock.id)
        .whereNull('deleted_at')
        .where('version', expectedVersion)
        .increment('version', 1);
      if (affected !== 1) {
        const current = await trx
          .from('stocks')
          .where('id', stock.id)
          .whereNull('deleted_at')
          .first();
        if (!current) throw new NotFoundException(`Stock item ${itemId} not found`);
        throw new PreconditionFailedException('Stock version is stale');
      }
      stock.version = expectedVersion + 1;
      if (attributesChanged) {
        await stock.merge(attributes).save();
      }
      if (photosChanged && photos !== undefined) {
        await stock.related('photos').query().delete();
        await stock.related('photos').createMany(photos);
      }
      if (pricesChanged && prices !== undefined) {
        await stock.related('prices').query().delete();
        await stock.related('prices').createMany(prices);
      }
      await stock.load('photos', (query) => query.orderBy('id'));
      await stock.load('prices', (query) => query.orderBy('id'));
      return this.adminStockDataMapper.mapStockModelToAdminStockItem(stock);
    });
  }

  private getStockChanges(stock: Stock, update: StockItemUpdateDto) {
    const attributesChanged =
      (update.name !== undefined && update.name !== stock.name) ||
      (update.itemDescription !== undefined && update.itemDescription !== stock.itemDescription) ||
      (update.availableQty !== undefined && update.availableQty !== stock.availableQty) ||
      (update.isVisible !== undefined && update.isVisible !== Boolean(stock.isVisible));
    return {
      attributesChanged,
      photosChanged: update.photos !== undefined && this.havePhotosChanged(stock, update.photos),
      pricesChanged: update.prices !== undefined && this.havePricesChanged(stock, update.prices),
    };
  }

  private havePhotosChanged(stock: Stock, photos: NonNullable<StockItemUpdateDto['photos']>) {
    return (
      photos.length !== stock.photos.length ||
      photos.some(
        (photo, i) =>
          photo.url !== stock.photos[i].url ||
          (photo.name ?? null) !== (stock.photos[i].name ?? null)
      )
    );
  }

  private havePricesChanged(stock: Stock, prices: NonNullable<StockItemUpdateDto['prices']>) {
    return (
      prices.length !== stock.prices.length ||
      prices.some((price, i) => {
        const current = stock.prices[i];
        return (
          price.currency !== current.currency ||
          price.price !== current.price ||
          price.vatAmount !== current.vatAmount ||
          price.vatRate !== Number(current.vatRate)
        );
      })
    );
  }

  async deleteSingleItemStock(itemId: string): Promise<{ itemId: string; deletedAt: DateTime }> {
    return db.transaction(async (trx) => {
      const stock = await Stock.query({ client: trx })
        .where('item_id', itemId)
        .whereNull('deleted_at')
        .forUpdate()
        .first();
      if (!stock) {
        throw new NotFoundException(`Stock item ${itemId} not found`);
      }
      if (stock.availableQty !== 0) {
        throw new ConflictException('Stock can only be deleted when available quantity is zero');
      }
      const deletedAt = DateTime.utc().startOf('second');
      stock.deletedAt = deletedAt;
      await stock.save();
      return { itemId: stock.itemId, deletedAt };
    });
  }
}
