import { OrderHistoryDto, OrderStatusCreateDto } from '#types/order_status';
import { TransactionClientContract } from '@adonisjs/lucid/types/database';

export interface OrderStatusBase {
  updateStatus(orderStatusCreate: OrderStatusCreateDto): Promise<void>;
  recordStatus(
    orderStatusCreate: OrderStatusCreateDto,
    trx: TransactionClientContract
  ): Promise<void>;
  fetchUserOrderStatusHistory(orderId: string, userId: string): Promise<Array<OrderHistoryDto>>;
}
