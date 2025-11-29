import { OrderHeadDto } from '#types/order';
import { Address } from '#types/address';

export default class CreateOrderInvoice {
  handle(invoiceData: { invoiceAddress: Address; order: OrderHeadDto }) {}
}
