import Order from '#models/order';
import {
  OrderCreatedDto,
  OrderCreateRequestDto,
  OrderDataDto,
  OrderSummaryDto,
} from '#types/order';
import db from '@adonisjs/lucid/services/db';
import OrderDataMapper from '#mappers/order/order_data_mapper';
import { OrderServiceBase } from '#types/interfaces/order/order_service_base';
import { DeliveryMethod } from '#types/enum/delivery_method';
import logger from '@adonisjs/core/services/logger';
import { NotFoundException } from '#exceptions/domain_exception';
import StockService from '#services/stock_service';
import OrderStatusService from '#services/order_status_service';
import { DateTime } from 'luxon';
import { PaginationQuery } from '#types/pagination';
import PaginationDataMapper from '#mappers/pagination_data_mapper';
import paginationConfig from '#config/pagination';
import { orderSortColumns } from '#common/pagination';

export default class OrderService implements OrderServiceBase {
  private orderDataMapper = new OrderDataMapper();
  private paginationDataMapper = new PaginationDataMapper();
  private stockService = new StockService();
  private orderStatusService = new OrderStatusService();

  async fetchUserOrderList(userId: string): Promise<Array<OrderSummaryDto>> {
    const userOrderList = await Order.findManyBy({ userId });
    const userOrderSkus = await Promise.all(
      userOrderList.map(async (order) => {
        await order.load('details');
        return order;
      })
    );
    const userOrderListMapped: Array<OrderSummaryDto> =
      this.orderDataMapper.mapOrderModelToOrderSummaryType(userOrderSkus);
    return userOrderListMapped;
  }

  async fetchUserOrderPage(userId: string, pagination: PaginationQuery) {
    const page = pagination.page ?? paginationConfig.defaultPage;
    const perPage = pagination.perPage ?? paginationConfig.defaultPerPage;
    const [sortField, sortDirection] = (pagination.sort ?? 'createdAt:desc').split(':');
    const sortColumn = orderSortColumns[sortField];
    if (!sortColumn || (sortDirection !== 'asc' && sortDirection !== 'desc')) {
      throw new Error('Invalid order pagination sort');
    }

    const paginator = await Order.query()
      .where('user_id', userId)
      .orderBy(sortColumn, sortDirection)
      .orderBy('id', 'asc')
      .preload('details')
      .paginate(page, perPage);
    const summaries = this.orderDataMapper.mapOrderModelToOrderSummaryType(paginator.all());
    const meta = paginator.getMeta();
    return this.paginationDataMapper.map(summaries, meta.currentPage, meta.perPage, meta.total);
  }

  async createOrder(orderCreate: OrderCreateRequestDto, userId: string): Promise<OrderCreatedDto> {
    logger.info(`Received request to create order for user ${userId}`);
    const result = await db.transaction(async (trx) => {
      logger.info('Mapping order create request to order model');
      logger.info(`Order create request: ${JSON.stringify(orderCreate)}`);
      const mappedOrder =
        this.orderDataMapper.mapOrderCreateRequestTypeToOrderWithDetailsModel(orderCreate);
      logger.info(`Mapped orderHeadWithDetails for order ${mappedOrder.orderHead.orderId}`);

      await this.stockService.updateStock(orderCreate.items, trx);
      const savedOrderHead = await Order.create(
        { ...mappedOrder.orderHead, userId },
        { client: trx }
      );
      const savedOrderSku = await savedOrderHead
        .related('details')
        .createMany(mappedOrder.details, { client: trx });

      let savedDeliveryAddress;
      if (orderCreate.delivery.method === DeliveryMethod.HOME_DELIVERY) {
        logger.info(
          `Creating delivery address for order ${savedOrderHead.orderId} and delivery method HOME_DELIVERY`
        );
        const mappedOrderDeliveryAddress =
          this.orderDataMapper.mapOrderCreateRequestTypeToDeliveryAddressModel(
            orderCreate.delivery.address!
          );
        savedDeliveryAddress = await savedOrderHead
          .related('deliveryAddress')
          .create(mappedOrderDeliveryAddress, { client: trx });
      }

      if (
        !savedOrderHead ||
        !savedOrderSku ||
        (orderCreate.delivery.method === DeliveryMethod.HOME_DELIVERY && !savedDeliveryAddress)
      ) {
        throw new Error('Could not create new order');
      }
      logger.info(`Successfully created order ${savedOrderHead.orderId}`);
      await this.orderStatusService.recordStatus(
        {
          orderId: savedOrderHead.orderId,
          status: mappedOrder.orderHead.status,
          statusDatetime: DateTime.now(),
          isVisibleToCustomer: true,
        },
        trx
      );
      return { orderId: savedOrderHead.orderId, details: savedOrderSku };
    });

    const order: OrderCreatedDto = { orderId: result.orderId, details: result.details };
    return order;
  }

  async fetchUserSingleOrder(orderId: string, userId: string): Promise<OrderDataDto> {
    const order = await Order.findBy({ orderId, userId });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    await order.load('details');
    if (order.deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
      await order.load('deliveryAddress');
    }
    const orderData: OrderDataDto = this.orderDataMapper.mapOrderModelToOrderDataType(order);
    return orderData;
  }
}
