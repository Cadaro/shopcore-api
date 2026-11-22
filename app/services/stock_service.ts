import StockDataMapper from '#mappers/stock/stock_data_mapper';
import Stock from '#models/stock';
import { ItemWithQty, StockItemDataDto, StockItemSummaryDto } from '#types/stock';
import {
  InsufficientStockError,
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

  private eligibleStockQuery(client?: TransactionClientContract) {
    const query = client ? Stock.query({ client }) : Stock.query();
    return query.where('is_visible', true).whereNull('deleted_at').where('available_qty', '>', 0);
  }

  async fetchSingleStockItem(itemId: string) {
    const singleStock = await this.eligibleStockQuery().where('item_id', itemId).first();
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

    const paginator = await this.eligibleStockQuery()
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
      const [updatedRows] = await this.eligibleStockQuery(trx)
        .where('item_id', item.itemId)
        .where('available_qty', '>=', item.qty)
        .decrement('available_qty', item.qty);
      if (!updatedRows) {
        throw new InsufficientStockError(`Insufficient stock for item ${item.itemId}`);
      }
    }
  }
}
