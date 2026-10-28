import {
  OrderCreatedDto,
  OrderCreateRequestDto,
  OrderDataDto,
  OrderSummaryDto,
} from '#types/order';

export interface OrderServiceBase {
  fetchUserOrderList(userId: string): Promise<Array<OrderSummaryDto>>;
  createOrder(orderCreate: OrderCreateRequestDto, userId: string): Promise<OrderCreatedDto>;
  fetchUserSingleOrder(orderId: string, userId: string): Promise<OrderDataDto>;
}
