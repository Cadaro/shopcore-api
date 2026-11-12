import { test } from '@japa/runner';
import { DomainRuleException } from '#exceptions/domain_exception';
import OrderDataMapper from '#mappers/order/order_data_mapper';
import Order from '#models/order';
import { CountryCode } from '#types/enum/country_code';
import { Currency } from '#types/enum/currency_code';
import { DeliveryMethod } from '#types/enum/delivery_method';
import { OrderStatus } from '#types/enum/order_status';
import { PaymentMethod } from '#types/enum/payment_method';

function captureError(callback: () => unknown): unknown {
  try {
    callback();
  } catch (error) {
    return error;
  }
  return undefined;
}

test.group('Order mappers', () => {
  test('maps order delivery variants and validates required delivery data', ({ assert }) => {
    const mapper = new OrderDataMapper();
    const homeOrderData = {
      orderId: 'order-1',
      status: OrderStatus.NEW,
      email: 'ada@example.test',
      phoneNumber: '123',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      courier: 'Courier',
      deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      deliveryPrice: 5,
      deliveryCurrency: Currency.GBP,
      deliveryVatRate: 0.2,
      details: [],
      createdAt: undefined,
      deliveryAddress: {
        streetName: 'St James',
        streetNumber: '1',
        apartmentNumber: '2A',
        city: 'London',
        postalCode: 'SW1A',
        countryCode: CountryCode.GB,
        region: 'Greater London',
      },
    };
    const homeOrder = Object.assign(new Order(), homeOrderData);
    assert.deepEqual(mapper.mapOrderModelToOrderDataType(homeOrder).delivery, {
      courier: 'Courier',
      method: DeliveryMethod.HOME_DELIVERY,
      deliveryPrice: 5,
      deliveryCurrency: Currency.GBP,
      deliveryVatRate: 0.2,
      address: {
        streetName: 'St James',
        streetNumber: '1',
        city: 'London',
        postalCode: 'SW1A',
        countryCode: CountryCode.GB,
        apartmentNumber: '2A',
        region: 'Greater London',
      },
    });

    const pickupOrder = Object.assign(new Order(), {
      ...homeOrderData,
      deliveryMethod: DeliveryMethod.PICKUP_POINT,
      pickupPointId: 'pickup-1',
      deliveryAddress: undefined,
      additionalNote: 'Leave at desk',
    });
    assert.deepEqual(mapper.mapOrderModelToOrderDataType(pickupOrder).delivery, {
      courier: 'Courier',
      method: DeliveryMethod.PICKUP_POINT,
      deliveryPrice: 5,
      deliveryCurrency: Currency.GBP,
      deliveryVatRate: 0.2,
      additionalNote: 'Leave at desk',
      pickupPointId: 'pickup-1',
    });

    const missingPickupId = Object.assign(new Order(), {
      ...homeOrderData,
      deliveryMethod: DeliveryMethod.PICKUP_POINT,
      pickupPointId: undefined,
      deliveryAddress: undefined,
    });
    assert.instanceOf(
      captureError(() => mapper.mapOrderModelToOrderDataType(missingPickupId)),
      DomainRuleException
    );

    const missingHomeAddress = Object.assign(new Order(), {
      ...homeOrderData,
      deliveryAddress: undefined,
    });
    assert.instanceOf(
      captureError(() => mapper.mapOrderModelToOrderDataType(missingHomeAddress)),
      DomainRuleException
    );
  });

  test('maps order create requests and delivery addresses, rejecting currency mismatches', ({
    assert,
  }) => {
    const mapper = new OrderDataMapper();
    const request = {
      email: 'ada@example.test',
      phoneNumber: '123',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      delivery: {
        courier: 'Courier',
        method: DeliveryMethod.HOME_DELIVERY,
        deliveryPrice: 5,
        deliveryVatRate: 0.2,
        deliveryCurrency: Currency.GBP,
        address: {
          streetName: 'St James',
          streetNumber: '1',
          apartmentNumber: '2A',
          city: 'London',
          postalCode: 'SW1A',
          countryCode: CountryCode.GB,
          region: 'Greater London',
        },
      },
      items: [
        {
          itemId: 'item-1',
          itemName: 'Book',
          qty: 2,
          itemPrice: 12.5,
          currency: Currency.GBP,
          vatAmount: 2.5,
          vatRate: 0.2,
        },
      ],
    };

    const mapped = mapper.mapOrderCreateRequestTypeToOrderWithDetailsModel(request);
    assert.match(mapped.orderHead.orderId, /^[0-9a-f-]{36}$/);
    assert.equal(mapped.orderHead.status, OrderStatus.NEW);
    assert.equal(mapped.orderHead.deliveryMethod, DeliveryMethod.HOME_DELIVERY);
    assert.deepEqual(mapped.details, request.items);
    assert.deepEqual(
      mapper.mapOrderCreateRequestTypeToDeliveryAddressModel(request.delivery.address),
      request.delivery.address
    );

    assert.instanceOf(
      captureError(() =>
        mapper.mapOrderCreateRequestTypeToOrderWithDetailsModel({
          ...request,
          delivery: { ...request.delivery, deliveryCurrency: Currency.EUR },
        })
      ),
      DomainRuleException
    );
  });

  test('maps order summaries and rejects inconsistent order currencies or empty details', ({
    assert,
  }) => {
    const mapper = new OrderDataMapper();
    const orderData = {
      orderId: 'order-1',
      status: OrderStatus.NEW,
      courier: 'Courier',
      deliveryMethod: DeliveryMethod.PICKUP_POINT,
      deliveryCurrency: Currency.GBP,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      createdAt: undefined,
      updatedAt: undefined,
      details: [
        { itemPrice: 12.5, qty: 2, currency: Currency.GBP },
        { itemPrice: 1.25, qty: 1, currency: Currency.GBP },
      ],
    };
    const order = Object.assign(new Order(), orderData);

    assert.deepEqual(mapper.mapOrderModelToOrderSummaryType([order])[0], {
      orderId: 'order-1',
      status: OrderStatus.NEW,
      itemsCount: 3,
      totalAmount: 26.25,
      courier: 'Courier',
      deliveryMethod: DeliveryMethod.PICKUP_POINT,
      currency: Currency.GBP,
      createdAt: undefined,
      updatedAt: undefined,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
    });
    assert.instanceOf(
      captureError(() =>
        mapper.mapOrderModelToOrderSummaryType([
          Object.assign(new Order(), { ...orderData, details: [] }),
        ])
      ),
      DomainRuleException
    );
    assert.instanceOf(
      captureError(() =>
        mapper.mapOrderModelToOrderSummaryType([
          Object.assign(new Order(), {
            ...orderData,
            details: [
              { itemPrice: 1, qty: 1, currency: Currency.GBP },
              { itemPrice: 1, qty: 1, currency: Currency.EUR },
            ],
          }),
        ])
      ),
      DomainRuleException
    );
    assert.instanceOf(
      captureError(() =>
        mapper.mapOrderModelToOrderSummaryType([
          Object.assign(new Order(), {
            ...orderData,
            deliveryCurrency: Currency.EUR,
          }),
        ])
      ),
      DomainRuleException
    );
  });
});
