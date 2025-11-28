import { Currency } from '#types/enum/currencyCode';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import { PaymentMethod } from '#types/enum/paymentMethod';
import { OrderCreateRequestDto } from '#types/order';

export const orderCreatePickupPointCOD: OrderCreateRequestDto = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '1234567890',
  paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
  delivery: {
    method: DeliveryMethod.PICKUP_POINT,
    pickupPointId: 'pickup-123',
    courier: 'GLOBAL COURIER SERVICE',
    deliveryCurrency: Currency.CHF,
    deliveryPrice: 5.99,
    deliveryVatRate: 0.19,
  },
  items: [
    {
      itemId: 'test-stock-item',
      itemName: 'blue t-shirt',
      itemPrice: 7.99,
      currency: Currency.CHF,
      qty: 1,
      vatAmount: 1.43,
      vatRate: 0.19,
    },
  ],
};
