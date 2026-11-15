import AdminStockService from '#services/admin_stock_service';
import { createStockValidator } from '#validators/stock';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class AdminStocksController {
  constructor(private stockService: AdminStockService) {}

  async store({ request, response }: HttpContext) {
    const stock = await request.validateUsing(createStockValidator);
    return response.created(await this.stockService.createSingleItemStock(stock));
  }
}
