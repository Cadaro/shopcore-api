import StockDataMapper from '#mappers/stock/stock_data_mapper';
import Stock from '#models/stock';
import { AdminStockItemDataDto, AdminStockItemSummaryDto } from '#types/stock';

export default class AdminStockDataMapper {
  private stockDataMapper = new StockDataMapper();

  mapStockModelToAdminStockItemSummary(stocks: Array<Stock>): Array<AdminStockItemSummaryDto> {
    return stocks.map((stock) => ({
      ...this.stockDataMapper.mapStockModelToStockItemSummaryDto(stock),
      isVisible: Boolean(stock.isVisible),
      deletedAt: stock.deletedAt,
    }));
  }

  mapStockModelToAdminStockItem(stock: Stock): AdminStockItemDataDto {
    return {
      ...this.stockDataMapper.mapStockModelToSingleStockItemDto(stock),
      isVisible: Boolean(stock.isVisible),
      deletedAt: stock.deletedAt,
    };
  }
}
