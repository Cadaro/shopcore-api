import AdminStockService from '#services/admin_stock_service';
import {
  createStockValidator,
  rejectEmptyStockUpdateValues,
  updateStockValidator,
} from '#validators/stock';
import { parseIfMatchVersion } from '#validators/if_match';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { createPaginationValidator } from '#validators/pagination';
import { stockSortColumns } from '#common/pagination';

const paginationValidator = createPaginationValidator(Object.keys(stockSortColumns));

@inject()
export default class AdminStocksController {
  constructor(private stockService: AdminStockService) {}

  async index({ request, response }: HttpContext) {
    const pagination = await request.validateUsing(paginationValidator, { data: request.qs() });
    return response.ok(await this.stockService.fetchAllStocks(pagination));
  }

  async show({ params, response }: HttpContext) {
    return response.ok(await this.stockService.fetchSingleStockItem(params.itemId));
  }

  async store({ request, response }: HttpContext) {
    const stock = await request.validateUsing(createStockValidator);
    return response.created(await this.stockService.createSingleItemStock(stock));
  }

  async update({ params, request, response }: HttpContext) {
    const expectedVersion = parseIfMatchVersion(request.header('if-match'));
    rejectEmptyStockUpdateValues(request.body());
    const stock = await request.validateUsing(updateStockValidator);
    return response.ok(
      await this.stockService.updateSingleItemStock(params.itemId, stock, expectedVersion)
    );
  }

  async destroy({ params, response }: HttpContext) {
    return response.ok(await this.stockService.deleteSingleItemStock(params.itemId));
  }
}
