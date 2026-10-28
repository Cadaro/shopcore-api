import { CountryCode } from '#types/enum/country_code';
import { Currency } from '#types/enum/currency_code';
import { DeliveryMethod } from '#types/enum/delivery_method';
import { PaymentMethod } from '#types/enum/payment_method';
import { OrderCreateRequestDto } from '#types/order';

export const orderCreateDifferentItemAndDeliveryCurrency: OrderCreateRequestDto = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '1234567890',
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  delivery: {
    method: DeliveryMethod.HOME_DELIVERY,
    courier: 'FAST_SHIP',
    deliveryCurrency: Currency.PLN,
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
