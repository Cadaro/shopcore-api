import StockDataMapper from '#mappers/stock/StockDataMapper';
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

export default class StockService {
  private stockDataMapper = new StockDataMapper();
  async isStockAvailable(stocks: Array<ItemWithQty>) {
    const foundStock = await Stock.query().whereIn(
      'item_id',
      stocks.map((s) => s.itemId)
    );
    for (const stock of stocks) {
      const stockItem = foundStock.find((s) => s.itemId === stock.itemId);
      if (!stockItem || stockItem.availableQty < stock.qty) {
        return false;
      }
    }
    return true;
  }

  async fetchSingleStockItem(itemId: string) {
    const singleStock = await Stock.findBy({ itemId });
    if (!singleStock) {
      throw new Error(`Stock item ${itemId} not found`);
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

  async updateStock(items: Array<ItemWithQty>) {
    const availableStock = await this.isStockAvailable(items);
    if (!availableStock) {
      throw new Error('Stock is not available');
    }
    await db.transaction(async (trx) => {
      for (const item of items) {
        const stockItem = await Stock.findBy({ itemId: item.itemId }, { client: trx });
        if (!stockItem) {
          throw new Error(`Stock item ${item.itemId} not found`);
        }
        stockItem.availableQty -= item.qty;
        stockItem.useTransaction(trx);
        await stockItem.save();
      }
    });
  }

  async createSingleItemStock(stock: StockItemCreateDto): Promise<StockItemCreatedDto> {
    stock.itemId = stock.itemId ?? randomUUID();
    const exists = await Stock.findBy({ itemId: stock.itemId });
    if (exists) {
      throw new Error(`Stock item = ${stock.itemId} already exists`);
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
