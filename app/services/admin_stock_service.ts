import { generateFixedSKU } from '#common/sku_generator';
import {
  ConflictException,
  DomainRuleException,
  InternalServerException,
  NotFoundException,
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

    const paginator = await Stock.query()
      .where('available_qty', '>=', 0)
      .orderBy(sortColumn, sortDirection)
      .orderBy('id', 'asc')
      .preload('photos')
      .preload('prices', (query) => query.orderBy('id'))
      .paginate(page, perPage);
    const stocks: Array<AdminStockItemSummaryDto> =
      this.adminStockDataMapper.mapStockModelToAdminStockItemSummary(paginator.all());
    const meta = paginator.getMeta();
    return this.paginationDataMapper.map(stocks, meta.currentPage, meta.perPage, meta.total);
  }

  async fetchSingleStockItem(itemId: string): Promise<AdminStockItemDataDto> {
    const stock = await Stock.query()
      .where('item_id', itemId)
      .where('available_qty', '>=', 0)
      .first();
    if (!stock) {
      throw new NotFoundException(`Stock item ${itemId} not found`);
    }
    await stock.load('photos');
    await stock.load('prices', (query) => query.orderBy('id'));
    return this.adminStockDataMapper.mapStockModelToAdminStockItem(stock);
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
    update: StockItemUpdateDto
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

      const { photos, prices, ...attributes } = update;
      if (Object.keys(attributes).length > 0) {
        await stock.merge(attributes).save();
      }
      if (photos !== undefined) {
        await stock.related('photos').query().delete();
        await stock.related('photos').createMany(photos);
      }
      if (prices !== undefined) {
        await stock.related('prices').query().delete();
        await stock.related('prices').createMany(prices);
      }
      await stock.load('photos');
      await stock.load('prices', (query) => query.orderBy('id'));
      return this.adminStockDataMapper.mapStockModelToAdminStockItem(stock);
    });
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
