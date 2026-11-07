import StockDataMapper from '#mappers/stock/stock_data_mapper';
import Stock from '#models/stock';
import {
  ItemWithQty,
  StockItemCreatedDto,
  StockItemCreateDto,
  StockItemDataDto,
  StockItemSummaryDto,
  StockItemUpdateDto,
} from '#types/stock';
import db from '@adonisjs/lucid/services/db';
import { randomUUID } from 'crypto';
import {
  ConflictException,
  InsufficientStockError,
  InternalServerException,
  NotFoundException,
  DomainRuleException,
} from '#exceptions/domain_exception';
import type { TransactionClientContract } from '@adonisjs/lucid/types/database';
import { PaginationQuery } from '#types/pagination';
import PaginationDataMapper from '#mappers/pagination_data_mapper';
import paginationConfig from '#config/pagination';
import { stockSortColumns } from '#common/pagination';

export default class StockService {
  private stockDataMapper = new StockDataMapper();
  private paginationDataMapper = new PaginationDataMapper();

  async fetchSingleStockItem(itemId: string) {
    const singleStock = await Stock.findBy({ itemId });
    if (!singleStock) {
      throw new NotFoundException(`Stock item ${itemId} not found`);
    }
    await singleStock.load('photos');
    await singleStock.load('prices', (query) => query.orderBy('id'));
    const mappedSingleStockItem: StockItemDataDto =
      this.stockDataMapper.mapStockModelToSingleStockItemDto(singleStock);
    return mappedSingleStockItem;
  }

  async fetchAvailableStock(pagination: PaginationQuery) {
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
      .where('available_qty', '>', 0)
      .orderBy(sortColumn, sortDirection)
      .orderBy('id', 'asc')
      .preload('photos')
      .preload('prices', (query) => query.orderBy('id'))
      .paginate(page, perPage);
    const mappedStockItemSummary: Array<StockItemSummaryDto> =
      this.stockDataMapper.mapStockModelToStockItemSummary(paginator.all());
    const meta = paginator.getMeta();
    return this.paginationDataMapper.map(
      mappedStockItemSummary,
      meta.currentPage,
      meta.perPage,
      meta.total
    );
  }

  async updateStock(items: Array<ItemWithQty>, trx: TransactionClientContract) {
    for (const item of items) {
      // Lucid wraps the affected-row count of write queries in an array
      const [updatedRows] = await Stock.query({ client: trx })
        .where('item_id', item.itemId)
        .where('available_qty', '>=', item.qty)
        .decrement('available_qty', item.qty);
      if (!updatedRows) {
        throw new InsufficientStockError(`Insufficient stock for item ${item.itemId}`);
      }
    }
  }

  async createSingleItemStock(stock: StockItemCreateDto): Promise<StockItemCreatedDto> {
    stock.itemId = stock.itemId ?? randomUUID();
    const exists = await Stock.findBy({ itemId: stock.itemId });
    if (exists) {
      throw new ConflictException(`Stock item = ${stock.itemId} already exists`);
    }
    if (stock.sku) {
      const skuExists = await Stock.findBy({ sku: stock.sku });
      if (skuExists) {
        throw new ConflictException(`Stock sku = ${stock.sku} already exists`);
      }
    }
    const createdStockItemId = await db.transaction(async (trx) => {
      const stockModel = this.stockDataMapper.mapStockItemCreateDtoToStockModel(stock);
      const { photos, prices, ...stockHead } = stockModel;
      const savedStockHead = await Stock.create(stockHead, { client: trx });
      const savedStockPhotos = await savedStockHead.related('photos').createMany(photos);
      const savedStockPrices = await savedStockHead.related('prices').createMany(prices);

      if (!savedStockHead || !savedStockPhotos || !savedStockPrices) {
        throw new InternalServerException(`Could not create new stock item = ${stock.itemId}`);
      }

      return savedStockHead.itemId;
    });
    return { itemId: createdStockItemId };
  }

  async updateSingleItemStock(
    itemId: string,
    stock: StockItemUpdateDto
  ): Promise<StockItemDataDto> {
    return db.transaction(async (trx) => {
      const stockModel = await Stock.findBy({ itemId }, { client: trx });
      if (!stockModel) {
        throw new NotFoundException(`Stock item ${itemId} not found`);
      }

      if (stock.sku) {
        const skuExists = await Stock.findBy({ sku: stock.sku }, { client: trx });
        if (skuExists && skuExists.id !== stockModel.id) {
          throw new ConflictException(`Stock sku = ${stock.sku} already exists`);
        }
      }

      const updatedStock = this.stockDataMapper.mapStockItemUpdateDtoToStockModel(itemId, stock);
      const { photos, prices, ...stockAttributes } = updatedStock;
      await stockModel.merge(stockAttributes).save();
      await stockModel.related('photos').query().delete();
      await stockModel.related('prices').query().delete();
      await stockModel.related('photos').createMany(photos);
      await stockModel.related('prices').createMany(prices);
      await stockModel.load('photos');
      await stockModel.load('prices', (query) => query.orderBy('id'));

      return this.stockDataMapper.mapStockModelToSingleStockItemDto(stockModel);
    });
  }
}
