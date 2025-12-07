import { Currency } from '#types/enum/currencyCode';
import { Address } from '#types/address';

/*
 * Enum for distinguishing between individual and company invoice customers
 */
export enum InvoiceCustomerTypeEnum {
  PERSON = 'PERSON',
  COMPANY = 'COMPANY',
}
/** Basic invoice customer information
 * firstName - customer's first name
 * lastName - customer's last name
 * companyName - customer's company name (optional)
 * taxId - customer's tax ID (optional)
 * type - type of customer (individual or company)
 */
export type InvoiceCustomerBasic = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  taxId?: string;
  customerType: InvoiceCustomerTypeEnum;
};

/** Complete invoice customer data structure
 * Combines basic customer information with address details
 * address - customer's address details
 */
export type InvoiceCustomerData = InvoiceCustomerBasic & { address: Address };

/** Invoice customer data structure including userId
 * userId - associated user ID
 * firstName - customer's first name
 * lastName - customer's last name
 * companyName - customer's company name
 * taxId - customer's tax ID
 * address - customer's address details
 */
export type InvoiceCustomerWithUserId = InvoiceCustomerData & { userId: string };

/** Invoice item structure for ordered products
 * itemId - unique item ID
 * itemName - name/description of the item
 * qty - quantity of the item
 * priceGross - gross price of the item
 * priceCurrency - currency of the price
 * vatAmount - VAT amount for the item
 * vatRate - VAT rate for the item
 */
export type InvoiceItem = {
  itemId: string;
  itemName: string;
  qty: number;
  priceGross: number;
  priceCurrency: Currency;
  vatAmount: number;
  vatRate: number;
};

/**
 * Invoice data structure
 * orderId - associated order ID
 * items - list of items in the invoice
 * customer - customer details for the invoice
 */
type InvoiceData = {
  orderId: string;
  userId: string;
  items: Array<InvoiceItem>;
  customer: InvoiceCustomerData;
};

/** Readonly version of InvoiceData to ensure immutability */
export type OrderInvoiceData = Readonly<InvoiceData>;

/** Possible prefixes for invoice numbers */
type InvoicePrefix = 'INV' | 'INVOICE' | 'FV';

/** Options for generating invoice numbers
 * prefix - prefix to be used in the invoice number (e.g., INV, INVOICE, FV)
 * useCurrentMonth - whether to include the current month in the invoice number
 * separator - separator character to use between parts of the invoice number
 */
export type InvoiceNumberOptions = Readonly<{
  prefix: InvoicePrefix;
  useCurrentMonth: boolean;
  separator: string;
}>;

/** Date suffix structure for invoice numbers */
export type DateSuffix = { year: string; month: string };

/** Prepared invoice number structure */
export type PreparedInvoiceNumber = Readonly<{
  newInvoiceNumber: string;
  currentInvoiceNumberSequence: number;
}>;
