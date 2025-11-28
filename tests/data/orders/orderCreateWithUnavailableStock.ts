import { CountryCode } from '#types/enum/countryCode';
import { Currency } from '#types/enum/currencyCode';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import { PaymentMethod } from '#types/enum/paymentMethod';
import { OrderCreateRequestDto } from '#types/order';

export const orderCreateWithUnavailableStock: OrderCreateRequestDto = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '1234567890',
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  delivery: {
    method: DeliveryMethod.HOME_DELIVERY,
    courier: 'FAST_SHIP',
    deliveryCurrency: Currency.EUR,
    deliveryPrice: 5.99,
    deliveryVatRate: 0.19,
    address: {
      streetName: 'Main Street',
      streetNumber: '123',
      apartmentNumber: '4B',
      city: 'Sample City',
      postalCode: '12345',
      countryCode: CountryCode.DE,
      region: 'Sample Region',
    },
  },
  items: [
    {
      itemId: 'test-stock-item',
      itemName: 'blue t-shirt',
      itemPrice: 7.99,
      currency: Currency.EUR,
      qty: 99,
      vatAmount: 1.43,
      vatRate: 0.19,
    },
  ],
};
