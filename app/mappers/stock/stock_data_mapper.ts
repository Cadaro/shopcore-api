import Stock from '#models/stock';
import {
  StockItemCreateDto,
  StockItemCreateDb,
  StockItemDataDto,
  StockItemDb,
  StockItemSummaryDto,
  StockPriceDto,
  StockItemUpdateDto,
  StockItemUpdateResponseDto,
} from '#types/stock';

export default class StockDataMapper {
  private mapPrices(stock: Stock): Array<StockPriceDto> {
    return stock.prices.map((price) => ({
      currency: price.currency,
      price: price.price,
      vatAmount: price.vatAmount,
      vatRate: price.vatRate,
    }));
  }

  mapStockModelToStockItemSummary(stockModel: Array<Stock>): Array<StockItemSummaryDto> {
    return stockModel.map((stock) => {
      return {
        itemId: stock.itemId,
        name: stock.name,
        sku: stock.sku,
        color: stock.color,
        prices: this.mapPrices(stock),
        availableQty: stock.availableQty,
        thumbnail: stock.photos[0],
        createdAt: stock.createdAt,
        updatedAt: stock.updatedAt,
      };
    });
  }
  mapStockItemCreateDtoToStockModel(stockDto: StockItemCreateDto, sku: string): StockItemCreateDb {
    return {
      itemId: stockDto.itemId!,
      sku,
      prices: stockDto.prices,
      name: stockDto.name,
      color: stockDto.color,
      isVisible: stockDto.isVisible,
      itemDescription: stockDto.itemDescription,
      size: stockDto.size,
      availableQty: stockDto.availableQty,
      photos: stockDto.photos,
    };
  }
  mapStockItemUpdateDtoToStockModel(
    itemId: string,
    stockDto: StockItemUpdateDto,
    sku: string
  ): StockItemDb {
    return {
      itemId,
      sku,
      prices: stockDto.prices,
      name: stockDto.name,
      itemDescription: stockDto.itemDescription,
      size: stockDto.size,
      availableQty: stockDto.availableQty,
      photos: stockDto.photos,
    };
  }
  mapStockModelToSingleStockItemDto(stockModel: Stock): StockItemDataDto {
    return {
      ...this.mapStockModelToStockItemBaseDto(stockModel),
      color: stockModel.color,
    };
  }
  mapStockModelToStockItemUpdateResponseDto(stockModel: Stock): StockItemUpdateResponseDto {
    return this.mapStockModelToStockItemBaseDto(stockModel);
  }
  private mapStockModelToStockItemBaseDto(stockModel: Stock) {
    return {
      itemId: stockModel.itemId,
      sku: stockModel.sku,
      prices: this.mapPrices(stockModel),
      name: stockModel.name,
      itemDescription: stockModel.itemDescription,
      size: stockModel.size,
      availableQty: stockModel.availableQty,
      photos: stockModel.photos,
    };
  }
}
