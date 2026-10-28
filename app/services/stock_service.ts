import StockDataMapper from '#mappers/stock/stock_data_mapper';
import Stock from '#models/stock';
import {
  ItemWithQty,
  StockItemCreatedDto,
  StockItemCreateDto,
  StockItemDataDto,
  StockItemSummaryDto,
} from '#types/stock';
import db from '@adonisjs/lucid/services/db';
import { randomUUID } from 'crypto';
import {
  ConflictException,
  InsufficientStockError,
  NotFoundException,
} from '#exceptions/domain_exception';
import type { TransactionClientContract } from '@adonisjs/lucid/types/database';

export default class StockService {
  private stockDataMapper = new StockDataMapper();

  async fetchSingleStockItem(itemId: string) {
    const singleStock = await Stock.findBy({ itemId });
    if (!singleStock) {
      throw new NotFoundException(`Stock item ${itemId} not found`);
    }
    await singleStock!.load('photos');
    const mappedSingleStockItem: StockItemDataDto =
      this.stockDataMapper.mapStockModelToSingleStockItemDto(singleStock);
    return mappedSingleStockItem;
    //
  }

  async fetchAvailableStock(): Promise<Array<StockItemSummaryDto>> {
    const stocks = await Stock.query().where('available_qty', '>', 0).preload('photos');
    const mappedStockItemSummary: Array<StockItemSummaryDto> =
      this.stockDataMapper.mapStockModelToStockItemSummary(stocks);
    return mappedStockItemSummary;
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
    const createdStockItemId = await db.transaction(async (trx) => {
      const stockModel = this.stockDataMapper.mapStockItemCreateDtoToStockModel(stock);
      const savedStockHead = await Stock.create(stockModel, { client: trx });
      const savedStockPhotos = await savedStockHead.related('photos').createMany(stockModel.photos);

      if (!savedStockHead || !savedStockPhotos) {
        throw new Error(`Could not create new stock item = ${stock.itemId}`);
      }

      return savedStockHead.itemId;
    });
    return { itemId: createdStockItemId };
  }
}
