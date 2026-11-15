import StockService from '#services/stock_service';
import { StockItemDataDto, StockItemUpdateDto } from '#types/stock';
import { updateStockValidator } from '#validators/stock';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { createPaginationValidator } from '#validators/pagination';
import { stockSortColumns } from '#common/pagination';

const paginationValidator = createPaginationValidator(Object.keys(stockSortColumns));

@inject()
export default class StocksController {
  constructor(private stockService: StockService) {}

  async index({ request, response }: HttpContext) {
    const pagination = await request.validateUsing(paginationValidator, { data: request.qs() });
    const stocks = await this.stockService.fetchAvailableStock(pagination);

    return response.ok(stocks);
  }

  async show({ params, response }: HttpContext) {
    const singleStockItem: StockItemDataDto = await this.stockService.fetchSingleStockItem(
      params.itemId
    );
    return response.ok(singleStockItem);
  }

  async update({ params, request, response }: HttpContext) {
    const stock: StockItemUpdateDto = await request.validateUsing(updateStockValidator);
    const updatedStock = await this.stockService.updateSingleItemStock(params.itemId, stock);
    return response.ok(updatedStock);
  }
}
