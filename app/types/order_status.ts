import { OrderStatus } from '#types/enum/order_status';
import { DateTime } from 'luxon';

export type OrderHistoryDto = {
  status: OrderStatus;
  statusDatetime: string;
};

export type OrderStatusCreateDto = {
  orderId: string;
  status: OrderStatus;
  statusDatetime: DateTime;
  isVisibleToCustomer: boolean;
};
