import logger from '@adonisjs/core/services/logger';
import { OrderStatusBase } from '#types/interfaces/order_status/order_status_base';
import { OrderStatusCreateDto } from '#types/order_status';
import { OrderStatus } from '#types/enum/order_status';
import { OrderStatusValidatorService } from '#services/order_status_validator_service';
import { NotFoundException } from '#exceptions/domain_exception';
import OrderStatusHistory from '#models/order_history';
import db from '@adonisjs/lucid/services/db';
import Order from '#models/order';
import { OrderHistoryDto } from '#types/order_status';
import { TransactionClientContract } from '@adonisjs/lucid/types/database';

export default class OrderStatusService implements OrderStatusBase {
  constructor() {
    logger.info('OrderStatusService initialized');
  }

  async updateStatus(orderStatusCreate: OrderStatusCreateDto): Promise<void> {
    const { orderId, status } = orderStatusCreate;
    logger.info(`Start updating order ${orderId} to status ${status}`);
    await db.transaction(async (trx) => {
      logger.info(`Checking current status for order ${orderId}`);
      const order = await Order.query({ client: trx })
        .where('orderId', orderId)
        .forUpdate()
        .first();
      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }
      logger.info(`Current status for order ${orderId} is ${order.status}`);
      logger.info(`Validating status transition for order ${orderId}`);
      OrderStatusValidatorService.validateTransition(
        order.status as OrderStatus,
        status,
        order.deliveryMethod
      );
      order.status = status;
      await order.save();
      logger.info(`Order ${orderId} successfully updated to status ${status}`);
      await this.recordStatus(orderStatusCreate, trx);
    });
  }

  async recordStatus(
    orderStatusCreate: OrderStatusCreateDto,
    trx: TransactionClientContract
  ): Promise<void> {
    logger.info(
      `Saving order status history for order ${orderStatusCreate.orderId} and status ${orderStatusCreate.status}`
    );
    await OrderStatusHistory.create(
      {
        orderId: orderStatusCreate.orderId,
        status: orderStatusCreate.status,
        statusDatetime: orderStatusCreate.statusDatetime,
        isVisibleToCustomer: orderStatusCreate.isVisibleToCustomer,
      },
      { client: trx }
    );
    logger.info(`Order status history for order ${orderStatusCreate.orderId} saved successfully`);
  }

  async fetchUserOrderStatusHistory(
    orderId: string,
    userId: string
  ): Promise<Array<OrderHistoryDto>> {
    const order = await Order.findBy({ orderId, userId });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    const history = await OrderStatusHistory.query()
      .where('orderId', orderId)
      .andWhere('is_visible_to_customer', true)
      .orderBy('status_datetime', 'asc')
      .orderBy('id', 'asc');
    return history.map((entry) => ({
      status: entry.status,
      statusDatetime: entry.statusDatetime.toISO()!,
    }));
  }
}
