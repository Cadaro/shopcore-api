import Order from '#models/order';
import {
  OrderCreatedDto,
  OrderCreateRequestDto,
  OrderDataDto,
  OrderSummaryDto,
} from '#types/order';
import db from '@adonisjs/lucid/services/db';
import OrderDataMapper from '#mappers/order/OrderDataMapper';
import { OrderServiceBase } from '#types/interfaces/order/OrderServiceBase';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import logger from '@adonisjs/core/services/logger';

export default class OrderService implements OrderServiceBase {
  private orderDataMapper = new OrderDataMapper();
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

  async createOrder(orderCreate: OrderCreateRequestDto, userId: string): Promise<OrderCreatedDto> {
    logger.info(`Received request to create order for user ${userId}`);
    const result = await db.transaction(async (trx) => {
      logger.info('Mapping order create request to order model');
      logger.info(`Order create request: ${JSON.stringify(orderCreate)}`);
      const mappedOrder =
        this.orderDataMapper.mapOrderCreateRequestTypeToOrderWithDetailsModel(orderCreate);
      logger.info(`Mapped orderHeadWithDetails for order ${mappedOrder.orderHead.orderId}`);

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
      return { orderId: savedOrderHead.orderId, details: savedOrderSku };
    });

    const order: OrderCreatedDto = { orderId: result.orderId, details: result.details };
    return order;
  }

  async fetchUserSingleOrder(orderId: string, userId: string): Promise<OrderDataDto> {
    const order = await Order.findBy({ orderId, userId });
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    await order.load('details');
    if (order.deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
      await order.load('deliveryAddress');
    }
    const orderData: OrderDataDto = this.orderDataMapper.mapOrderModelToOrderDataType(order);
    return orderData;
  }
}
