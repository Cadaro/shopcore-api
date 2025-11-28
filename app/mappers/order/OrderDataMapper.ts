import Order from '#models/order';
import {
  OrderDetailDb,
  OrderSummaryDto,
  OrderWithDetailsDb,
  OrderDataDto,
  OrderCreateRequestDto,
  OrderHeadDb,
} from '#types/order';
import { OrderStatus } from '#types/enum/orderStatus';
import { randomUUID } from 'crypto';
import { DeliveryAddressDb } from '#types/deliveryData';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import logger from '@adonisjs/core/services/logger';
import { Address } from '#types/address';

export default class OrderDataMapper {
  mapOrderModelToOrderDataType(orderModel: Order): OrderDataDto {
    const result: Partial<OrderDataDto> = {
      orderId: orderModel.orderId,
      status: orderModel.status,
      email: orderModel.email,
      phoneNumber: orderModel.phoneNumber,
      paymentMethod: orderModel.paymentMethod,
      delivery: {
        courier: orderModel.courier,
        method: orderModel.deliveryMethod,
        deliveryPrice: orderModel.deliveryPrice,
        deliveryCurrency: orderModel.deliveryCurrency,
        deliveryVatRate: orderModel.deliveryVatRate,
      },
      details: orderModel.details.map((sku) => ({
        itemId: sku.itemId,
        itemName: sku.itemName,
        qty: sku.qty,
        itemPrice: sku.itemPrice,
        currency: sku.currency,
        vatAmount: sku.vatAmount,
        vatRate: sku.vatRate,
      })),
      createdAt: orderModel.createdAt,
    };

    if (orderModel.firstName) {
      result.firstName = orderModel.firstName;
    }

    if (orderModel.lastName) {
      result.lastName = orderModel.lastName;
    }

    if (orderModel.companyName) {
      result.companyName = orderModel.companyName;
    }

    if (orderModel.additionalNote) {
      result.delivery!.additionalNote = orderModel.additionalNote;
    }

    if (orderModel.deliveryMethod === DeliveryMethod.PICKUP_POINT) {
      if (!orderModel.pickupPointId) {
        throw new Error('Missing pickup point ID for PICKUP_POINT method');
      }
      result.delivery!.pickupPointId = orderModel.pickupPointId;
    }

    if (orderModel.deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
      if (!orderModel.deliveryAddress) {
        throw new Error('Missing delivery address for HOME_DELIVERY method');
      }
      result.delivery!.address = {
        streetName: orderModel.deliveryAddress.streetName,
        streetNumber: orderModel.deliveryAddress.streetNumber,
        city: orderModel.deliveryAddress.city,
        postalCode: orderModel.deliveryAddress.postalCode,
        countryCode: orderModel.deliveryAddress.countryCode,
      };

      if (orderModel.deliveryAddress.apartmentNumber) {
        result.delivery!.address!.apartmentNumber = orderModel.deliveryAddress.apartmentNumber;
      }
      if (orderModel.deliveryAddress.region) {
        result.delivery!.address!.region = orderModel.deliveryAddress.region;
      }
    }

    return result as OrderDataDto;
  }

  mapOrderModelToOrderSummaryType(ordersWithDetailsDb: Array<Order>): Array<OrderSummaryDto> {
    const orderSummaries: Array<OrderSummaryDto> = [];
    ordersWithDetailsDb.forEach((order) => {
      if (order.details.length === 0) {
        throw new Error(`Order ${order.orderId} has no details`);
      }
      //check if all items have the same currency
      const allItemsSameCurrency = order.details.every(
        (item) => item.currency === order.details[0].currency
      );
      if (!allItemsSameCurrency) {
        throw new Error(`Order ${order.orderId} has items with different currencies`);
      }
      if (order.details[0].currency !== order.deliveryCurrency) {
        throw new Error(`Order ${order.orderId} has different currency between items and delivery`);
      }

      const totalAmount = order.details.reduce((sum, item) => sum + item.itemPrice * item.qty, 0);
      const itemsCount = order.details.reduce((count, item) => count + item.qty, 0);
      orderSummaries.push({
        orderId: order.orderId,
        status: order.status,
        itemsCount,
        totalAmount,
        courier: order.courier,
        deliveryMethod: order.deliveryMethod,
        currency: order.details[0].currency,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        paymentMethod: order.paymentMethod,
      });
    });
    return orderSummaries;
  }

  mapOrderCreateRequestTypeToOrderWithDetailsModel(
    orderCreate: OrderCreateRequestDto
  ): OrderWithDetailsDb {
    //check if all items have the same currency
    const allItemsSameCurrency = orderCreate.items.every(
      (item) => item.currency === orderCreate.items[0].currency
    );
    if (!allItemsSameCurrency) {
      logger.error('Currency mismatch between items in the order');
      throw new Error(`Order has items with different currencies`);
    }
    if (orderCreate.items[0].currency !== orderCreate.delivery.deliveryCurrency) {
      logger.error('Currency mismatch between items and delivery');
      throw new Error(`Order has different currency between items and delivery`);
    }

    logger.info('All items have the same currency, proceeding with mapping');
    const orderId = randomUUID();
    logger.info(`Assigned order id: ${orderId}`);
    const orderHeadDb: OrderHeadDb = {
      orderId,
      firstName: orderCreate.firstName,
      lastName: orderCreate.lastName,
      companyName: orderCreate.companyName,
      email: orderCreate.email,
      phoneNumber: orderCreate.phoneNumber,
      status: OrderStatus.NEW,
      courier: orderCreate.delivery.courier,
      deliveryMethod: orderCreate.delivery.method,
      pickupPointId: orderCreate.delivery.pickupPointId,
      additionalNote: orderCreate.delivery.additionalNote,
      deliveryPrice: orderCreate.delivery.deliveryPrice,
      deliveryCurrency: orderCreate.delivery.deliveryCurrency,
      deliveryVatRate: orderCreate.delivery.deliveryVatRate,
      paymentMethod: orderCreate.paymentMethod,
    };
    logger.info(`Mapped order head: ${JSON.stringify(orderHeadDb)}`);
    const orderSkuDb: Array<OrderDetailDb> = [];
    orderCreate.items.map((sku) => {
      const result: OrderDetailDb = {
        itemId: sku.itemId,
        itemName: sku.itemName,
        qty: sku.qty,
        itemPrice: sku.itemPrice,
        currency: sku.currency,
        vatAmount: sku.vatAmount,
        vatRate: sku.vatRate,
      };
      orderSkuDb.push(result);
    });
    logger.info(`Mapped order SKUs: ${JSON.stringify(orderSkuDb)}`);

    const orderWithDetailsDb: OrderWithDetailsDb = {
      orderHead: orderHeadDb,
      details: orderSkuDb,
    };
    return orderWithDetailsDb;
  }

  mapOrderCreateRequestTypeToDeliveryAddressModel(
    orderDeliveryAddress: Address
  ): DeliveryAddressDb {
    const orderAddressDb: DeliveryAddressDb = {
      streetName: orderDeliveryAddress.streetName,
      streetNumber: orderDeliveryAddress.streetNumber,
      apartmentNumber: orderDeliveryAddress.apartmentNumber,
      city: orderDeliveryAddress.city,
      postalCode: orderDeliveryAddress.postalCode,
      countryCode: orderDeliveryAddress.countryCode,
      region: orderDeliveryAddress.region,
    };
    logger.info(`Mapped delivery address: ${JSON.stringify(orderAddressDb)}`);
    return orderAddressDb;
  }
}
