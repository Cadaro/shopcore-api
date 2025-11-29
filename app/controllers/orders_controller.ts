import { createOrderDetailValidator } from '#validators/create_order';
import { HttpContext } from '@adonisjs/core/http';
import {
  OrderCreatedDto,
  OrderCreateRequestDto,
  OrderDataDto,
  OrderSummaryDto,
} from '#types/order';
import StockService from '#services/stock_service';
import OrderService from '#services/order_service';
import { StatusCodeEnum } from '#types/response';
import ResponseErrorHandler from '#exceptions/response';
import { inject } from '@adonisjs/core';
import logger from '@adonisjs/core/services/logger';

@inject()
export default class OrdersController {
  constructor(
    private orderService: OrderService,
    private stockService: StockService
  ) {}

  async index({ auth, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    logger.info(`Fetching order list for user ${auth.user!.uuid}`);
    const orderSummaries: Array<OrderSummaryDto> = await this.orderService.fetchUserOrderList(
      auth.user!.uuid
    );
    logger.info(`Fetched ${orderSummaries.length} orders for user ${auth.user!.uuid}`);
    return response.ok(orderSummaries);
  }

  async store({ auth, request, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    logger.info(`Creating order for user ${auth.user!.uuid}`);
    const orderCreate: OrderCreateRequestDto = await request.validateUsing(
      createOrderDetailValidator
    );

    try {
      logger.info(`Updating stock for order items`);
      await this.stockService.updateStock(orderCreate.items);
      logger.info(`Stock updated successfully`);

      logger.info(`Proceeding to create order for user ${auth.user!.uuid}`);
      const createdOrder: OrderCreatedDto = await this.orderService.createOrder(
        orderCreate,
        auth.user!.uuid
      );
      logger.info(`Order ${createdOrder.orderId} created successfully for user ${auth.user!.uuid}`);
      return response.created(createdOrder);
    } catch (e) {
      return new ResponseErrorHandler().handleError(response, StatusCodeEnum.BadRequest, e);
    }
  }

  async show({ auth, params, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    logger.info(`Fetching order ${params.orderId} for user ${auth.user!.uuid}`);
    try {
      const orderData: OrderDataDto = await this.orderService.fetchUserSingleOrder(
        params.orderId,
        auth.user!.uuid
      );
      logger.info(`Fetched order ${params.orderId} for user ${auth.user!.uuid}`);

      return response.ok(orderData);
    } catch (e) {
      return new ResponseErrorHandler().handleError(response, StatusCodeEnum.NotFound, e);
    }
  }
}
