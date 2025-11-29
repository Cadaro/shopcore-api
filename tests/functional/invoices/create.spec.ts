import SaveInvoice from '#services/save_invoice_service';
import OrderService from '#services/order_service';
import { CountryCode } from '#types/enum/countryCode';
import {
  InvoiceCustomerTypeEnum,
  InvoiceItem,
  InvoiceNumberOptions,
  OrderInvoiceData,
} from '#types/invoice';
import { OrderCreateRequestDto, OrderSkuDto } from '#types/order';
import { Currency } from '#types/enum/currencyCode';
import { test } from '@japa/runner';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import { PaymentMethod } from '#types/enum/paymentMethod';
import User from '#models/user';
import { randomUUID } from 'crypto';

test.group('Invoices create', (group) => {
  const orderService = new OrderService();
  let invoicePersonData: OrderInvoiceData;
  let invoiceCompanyData: OrderInvoiceData;

  group.setup(async () => {
    const invoiceItems: Array<InvoiceItem> = [
      {
        priceCurrency: Currency.PLN,
        itemId: '1234abc',
        itemName: 'test item name',
        priceGross: 23.99,
        qty: 1,
        vatAmount: 4.99,
        vatRate: 0.23,
      },
    ];
    const items: Array<OrderSkuDto> = [];
    invoiceItems.forEach((item) => {
      items.push({
        itemId: item.itemId,
        itemName: item.itemName,
        currency: item.priceCurrency,
        itemPrice: item.priceGross,
        qty: item.qty,
        vatAmount: item.vatAmount,
        vatRate: item.vatRate,
      });
    });
    const firstOrderReq: OrderCreateRequestDto = {
      firstName: 'Test Name',
      lastName: 'Test last Name',
      email: 'test@example.com',
      phoneNumber: '123456789',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      delivery: {
        method: DeliveryMethod.PICKUP_POINT,
        pickupPointId: 'pickup-123',
        courier: 'GLOBAL COURIER',
        deliveryCurrency: Currency.PLN,
        deliveryPrice: 12.99,
        deliveryVatRate: 0.23,
      },
      items: items,
    };
    const secondOrderReq: OrderCreateRequestDto = {
      firstName: 'Test Name',
      lastName: 'Test last Name',
      email: 'test@example.com',
      phoneNumber: '123456789',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      delivery: {
        method: DeliveryMethod.PICKUP_POINT,
        pickupPointId: 'pickup-123',
        courier: 'GLOBAL COURIER',
        deliveryCurrency: Currency.PLN,
        deliveryPrice: 12.99,
        deliveryVatRate: 0.23,
      },
      items: items,
    };
    const createUser = (): Promise<User> => {
      return User.create({
        email: `${randomUUID()}@example.com`,
        password: 'Test123',
        uuid: randomUUID(),
      });
    };
    const user = await createUser();
    const firstOrder = await orderService.createOrder(firstOrderReq, user.uuid);
    const secondOrder = await orderService.createOrder(secondOrderReq, user.uuid);
    invoicePersonData = {
      orderId: firstOrder.orderId,
      userId: user.uuid,
      items: invoiceItems,
      customer: {
        firstName: 'Test Name',
        lastName: 'Test last Name',
        customerType: InvoiceCustomerTypeEnum.PERSON,
        address: {
          city: 'Test city',
          countryCode: CountryCode.PL,
          postalCode: '01-234',
          streetName: 'Test street',
          streetNumber: '4A',
        },
      },
    };
    invoiceCompanyData = {
      orderId: secondOrder.orderId,
      userId: user.uuid,
      items: invoiceItems,
      customer: {
        companyName: 'Test Company',
        taxId: '123-456-32-18',
        customerType: InvoiceCustomerTypeEnum.COMPANY,
        address: {
          city: 'Test city',
          countryCode: CountryCode.PL,
          postalCode: '01-234',
          streetName: 'Test street',
          streetNumber: '4A',
        },
      },
    };
  });

  test('create invoice order for type person with invoice number options, with month', async ({
    assert,
  }) => {
    const invoiceNumberOptions: InvoiceNumberOptions = {
      prefix: 'FV',
      separator: '/',
      useCurrentMonth: true,
    };

    const saveInvoiceService = new SaveInvoice();
    const result = await saveInvoiceService.save(invoicePersonData, invoiceNumberOptions);
    const invoiceNumberRegex = /^(FV) (0*[1-9]\d{0,3})\/(0?[1-9]|1[0-2])\/\d{4}$/;
    assert.match(result, invoiceNumberRegex);
  });

  test('create invoice order for type person with invoice number options, without month', async ({
    assert,
  }) => {
    const invoiceNumberOptions: InvoiceNumberOptions = {
      prefix: 'FV',
      separator: '/',
      useCurrentMonth: false,
    };

    const saveInvoiceService = new SaveInvoice();
    const result = await saveInvoiceService.save(invoicePersonData, invoiceNumberOptions);
    const invoiceNumberRegex = /^(FV) (0*[1-9]\d{0,3})\/\d{4}$/;
    assert.match(result, invoiceNumberRegex);
  });

  test('create invoice order for type person without invoice number options', async ({
    assert,
  }) => {
    const saveInvoiceService = new SaveInvoice();
    const result = await saveInvoiceService.save(invoicePersonData);
    const invoiceNumberRegex = /^(INV) (0*[1-9]\d{0,3})\/(0?[1-9]|1[0-2])\/\d{4}$/;
    assert.match(result, invoiceNumberRegex);
  });

  test('create invoice order for type company without invoice number options', async ({
    assert,
  }) => {
    const saveInvoiceService = new SaveInvoice();
    const result = await saveInvoiceService.save(invoiceCompanyData);
    const invoiceNumberRegex = /^(INV) (0*[1-9]\d{0,3})\/(0?[1-9]|1[0-2])\/\d{4}$/;
    assert.match(result, invoiceNumberRegex);
  });
});
