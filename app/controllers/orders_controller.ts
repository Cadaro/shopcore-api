import { createOrderDetailValidator } from '#validators/create_order';
import { HttpContext } from '@adonisjs/core/http';
import { OrderCreatedDto, OrderCreateRequestDto, OrderDataDto } from '#types/order';
import OrderService from '#services/order_service';
import { inject } from '@adonisjs/core';
import logger from '@adonisjs/core/services/logger';
import { createPaginationValidator } from '#validators/pagination';
import { orderSortColumns } from '#common/pagination';

const paginationValidator = createPaginationValidator(Object.keys(orderSortColumns));

@inject()
export default class OrdersController {
  constructor(private orderService: OrderService) {}

  async index({ auth, request, response }: HttpContext) {
    const pagination = await request.validateUsing(paginationValidator, { data: request.qs() });
    // Permission middleware ensures authentication, so auth.user is guaranteed to exist
    logger.info(`Fetching order list for user ${auth.user!.uuid}`);
    const orderSummaries = await this.orderService.fetchUserOrderPage(auth.user!.uuid, pagination);
    logger.info(`Fetched ${orderSummaries.data.length} orders for user ${auth.user!.uuid}`);
    return response.ok(orderSummaries);
  }

  async store({ auth, request, response }: HttpContext) {
    // Permission middleware ensures authentication, so auth.user is guaranteed to exist
    logger.info(`Creating order for user ${auth.user!.uuid}`);
    const orderCreate: OrderCreateRequestDto = await request.validateUsing(
      createOrderDetailValidator
    );

    const createdOrder: OrderCreatedDto = await this.orderService.createOrder(
      orderCreate,
      auth.user!.uuid
    );
    logger.info(`Order ${createdOrder.orderId} created successfully for user ${auth.user!.uuid}`);
    return response.created(createdOrder);
  }

  async show({ auth, params, response }: HttpContext) {
    // Permission middleware ensures authentication, so auth.user is guaranteed to exist
    logger.info(`Fetching order ${params.orderId} for user ${auth.user!.uuid}`);
    const orderData: OrderDataDto = await this.orderService.fetchUserSingleOrder(
      params.orderId,
      auth.user!.uuid
    );
    logger.info(`Fetched order ${params.orderId} for user ${auth.user!.uuid}`);

    return response.ok(orderData);
  }
}
