import StockService from '#services/stock_service';
import {
  StockItemCreatedDto,
  StockItemCreateDto,
  StockItemDataDto,
  StockItemSummaryDto,
  StockItemUpdateDto,
} from '#types/stock';
import { createStockValidator, updateStockValidator } from '#validators/stock';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class StocksController {
  constructor(private stockService: StockService) {}

  async index({ response }: HttpContext) {
    const stocks: Array<StockItemSummaryDto> = await this.stockService.fetchAvailableStock();

    return response.ok(stocks);
  }

  async show({ params, response }: HttpContext) {
    const singleStockItem: StockItemDataDto = await this.stockService.fetchSingleStockItem(
      params.itemId
    );
    return response.ok(singleStockItem);
  }

  async store({ request, response }: HttpContext) {
    // Admin middleware ensures only admins can reach this point
    const singleStockItem: StockItemCreateDto = await request.validateUsing(createStockValidator);
    const createdSingleStockItemId: StockItemCreatedDto =
      await this.stockService.createSingleItemStock(singleStockItem);
    return response.created(createdSingleStockItemId);
  }

  async update({ params, request, response }: HttpContext) {
    const stock: StockItemUpdateDto = await request.validateUsing(updateStockValidator);
    const updatedStock = await this.stockService.updateSingleItemStock(params.itemId, stock);
    return response.ok(updatedStock);
  }
}
