import { InvoiceItem, OrderInvoiceData } from '#types/invoice';
import { OrderSkuDto } from '#types/order';

export default class InvoiceDataMapper {
  mapInvoiceHead(invoiceData: OrderInvoiceData, invoiceId: string) {
    const { orderId, customer } = invoiceData;
    const {
      firstName,
      lastName,
      address: { city, countryCode, postalCode, streetName, streetNumber, apartmentNumber, region },
    } = customer;

    return {
      invoiceId,
      orderId,
      firstName,
      lastName,
      city,
      countryCode,
      postalCode,
      streetName,
      streetNumber,
      apartmentNumber,
      region,
    };
  }

  mapInvoiceDetails(orderDetails: Array<OrderSkuDto>) {
    const invoiceItems: Array<InvoiceItem> = [];
    orderDetails.forEach((item) => {
      invoiceItems.push({
        itemId: item.itemId,
        itemName: item.itemName,
        priceCurrency: item.currency,
        priceGross: item.itemPrice,
        qty: item.qty,
        vatAmount: item.vatAmount,
        vatRate: item.vatRate,
      });
    });
    return invoiceItems;
  }
}
