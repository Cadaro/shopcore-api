import Stock from '#models/stock';
import {
  StockItemCreateDto,
  StockItemDataDto,
  StockItemDb,
  StockItemSummaryDto,
} from '#types/stock';

export default class StockDataMapper {
  mapStockModelToStockItemSummary(stockModel: Array<Stock>): Array<StockItemSummaryDto> {
    return stockModel.map((stock) => {
      return {
        itemId: stock.itemId,
        name: stock.name,
        price: stock.price,
        priceCurrency: stock.priceCurrency,
        availableQty: stock.availableQty,
        thumbnail: stock.photos[0],
      };
    });
  }
  mapStockItemCreateDtoToStockModel(stockDto: StockItemCreateDto): StockItemDb {
    return {
      itemId: stockDto.itemId!,
      price: stockDto.price,
      priceCurrency: stockDto.priceCurrency,
      vatAmount: stockDto.vatAmount,
      vatRate: stockDto.vatRate,
      name: stockDto.name,
      itemDescription: stockDto.itemDescription,
      size: stockDto.size,
      availableQty: stockDto.availableQty,
      photos: stockDto.photos,
    };
  }
  mapStockModelToSingleStockItemDto(stockModel: Stock): StockItemDataDto {
    return {
      itemId: stockModel.itemId,
      price: stockModel.price,
      priceCurrency: stockModel.priceCurrency,
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
