import { Currency } from '#types/enum/currencyCode';

type StockPhoto = {
  url: string;
  name?: string;
};

export type StockItemSummaryDto = {
  itemId: string;
  name: string;
  price: number;
  priceCurrency: Currency;
  availableQty: number;
  thumbnail: StockPhoto;
};

export type StockItemDataDto = {
  itemId: string;
  price: number;
  priceCurrency: Currency;
  vatAmount: number;
  vatRate: number;
  name: string;
  itemDescription: string;
  size?: string;
  availableQty: number;
  photos: Array<StockPhoto>;
};

export type StockItemCreateDto = {
  itemId?: string;
  price: number;
  priceCurrency: Currency;
  vatAmount: number;
  vatRate: number;
  name: string;
  itemDescription: string;
  size?: string;
  availableQty: number;
  photos: Array<StockPhoto>;
};

export type StockItemCreatedDto = {
  itemId: string;
};

export type StockItemDb = {
  itemId: string;
  price: number;
  priceCurrency: Currency;
  vatAmount: number;
  vatRate: number;
  name: string;
  itemDescription: string;
  size?: string;
  availableQty: number;
  photos: Array<StockPhoto>;
};

export type ItemWithQty = {
  itemId: string;
  qty: number;
};
