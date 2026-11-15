import { generateFixedSKU } from '#common/sku_generator';
import { ConflictException, InternalServerException } from '#exceptions/domain_exception';
import StockDataMapper from '#mappers/stock/stock_data_mapper';
import Stock from '#models/stock';
import { StockItemCreateDto, StockItemCreatedDto } from '#types/stock';
import db from '@adonisjs/lucid/services/db';
import { randomUUID } from 'node:crypto';

export default class AdminStockService {
  private stockDataMapper = new StockDataMapper();

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
}
