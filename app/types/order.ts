import { DateTime } from 'luxon';
import { DeliveryDataDto } from '#types/deliveryData';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import { OrderStatus } from '#types/enum/orderStatus';
import { Currency } from '#types/enum/currencyCode';
import { PaymentMethod } from './enum/paymentMethod.js';

/**
 * Represents a single SKU/item in an order.
 * itemId: Unique identifier for the item.
 * itemName: Name or description of the item.
 * qty: Quantity of the item ordered.
 * itemPrice: Price per item.
 * currency: Currency of the price.
 * vatAmount: VAT amount applicable to the item.
 * vatRate: VAT rate applicable to the item.
 */
export type OrderSkuDto = {
  itemId: string;
  itemName: string;
  qty: number;
  itemPrice: number;
  currency: Currency;
  vatAmount: number;
  vatRate: number;
};

/**
 * Represents the head information of an order.
 * orderId: Unique identifier for the order.
 * firstName: First name of the customer.
 * lastName: Last name of the customer.
 * email: Email address of the customer.
 * phoneNumber: Phone number of the customer.
 * status: Current status of the order.
 * deliveryData: Delivery information associated with the order.
 * createdAt: Timestamp when the order was created.
 * details: Array of items/SKUs included in the order.
 */
export type OrderHeadDto = {
  orderId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  delivery: DeliveryDataDto;
  createdAt?: DateTime;
  details: Array<OrderSkuDto>;
};

/** Complete order data structure
 * Combines order head information with detailed items/SKUs.
 */
export type OrderDataDto = OrderHeadDto & { details: Array<OrderSkuDto> };

/** Summary information about an order
 * orderId - unique identifier for the order
 * status - current status of the order
 * itemsCount - total number of items in the order
 * totalAmount - total monetary amount of the order
 * currency - currency of the order amount
 * createdAt - timestamp when the order was created
 * updatedAt - timestamp when the order was last updated
 */
export type OrderSummaryDto = {
  orderId: string;
  status: OrderStatus;
  itemsCount: number;
  totalAmount: number;
  courier: string;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  currency: Currency;
  createdAt?: DateTime;
  updatedAt?: DateTime;
};

export type OrderCreateRequestDto = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
  delivery: DeliveryDataDto;
  items: Array<OrderSkuDto>;
};

/**
 * Response DTO for a created order
 * orderId: Unique identifier for the created order.
 * details: Array of items/SKUs included in the created order.
 */
export type OrderCreatedDto = {
  orderId: string;
  details: Array<OrderSkuDto>;
};

export type OrderHeadDb = {
  orderId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
  courier: string;
  deliveryMethod: DeliveryMethod;
  pickupPointId?: string;
  additionalNote?: string;
  deliveryPrice: number;
  deliveryVatRate: number;
  deliveryCurrency: Currency;
  status: OrderStatus;
};

export type OrderDetailDb = {
  itemId: string;
  itemName: string;
  qty: number;
  itemPrice: number;
  currency: Currency;
  vatAmount: number;
  vatRate: number;
};

export type OrderWithDetailsDb = { orderHead: OrderHeadDb } & {
  details: Array<OrderDetailDb>;
};
