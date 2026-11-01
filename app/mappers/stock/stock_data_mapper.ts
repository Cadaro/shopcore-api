import Stock from '#models/stock';
import {
  StockItemCreateDto,
  StockItemDataDto,
  StockItemDb,
  StockItemSummaryDto,
  StockPriceDto,
  StockItemUpdateDto,
} from '#types/stock';

export default class StockDataMapper {
  private mapPrices(stock: Stock): Array<StockPriceDto> {
    return stock.prices.map((price) => ({ currency: price.currency, price: price.price }));
  }

  mapStockModelToStockItemSummary(stockModel: Array<Stock>): Array<StockItemSummaryDto> {
    return stockModel.map((stock) => {
      return {
        itemId: stock.itemId,
        name: stock.name,
        sku: stock.sku,
        prices: this.mapPrices(stock),
        availableQty: stock.availableQty,
        thumbnail: stock.photos[0],
      };
    });
  }
  mapStockItemCreateDtoToStockModel(stockDto: StockItemCreateDto): StockItemDb {
    return {
      itemId: stockDto.itemId!,
      sku: stockDto.sku ?? null,
      prices: stockDto.prices,
      vatAmount: stockDto.vatAmount,
      vatRate: stockDto.vatRate,
      name: stockDto.name,
      itemDescription: stockDto.itemDescription,
      size: stockDto.size,
      availableQty: stockDto.availableQty,
      photos: stockDto.photos,
    };
  }
  mapStockItemUpdateDtoToStockModel(itemId: string, stockDto: StockItemUpdateDto): StockItemDb {
    return {
      ...this.mapStockItemCreateDtoToStockModel({ ...stockDto, itemId }),
    };
  }
  mapStockModelToSingleStockItemDto(stockModel: Stock): StockItemDataDto {
    return {
      itemId: stockModel.itemId,
      sku: stockModel.sku,
      prices: this.mapPrices(stockModel),
      vatAmount: stockModel.vatAmount,
      vatRate: stockModel.vatRate,
      name: stockModel.name,
      itemDescription: stockModel.itemDescription,
      size: stockModel.size,
      availableQty: stockModel.availableQty,
      photos: stockModel.photos,
    };
  }
}
