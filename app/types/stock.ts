import { Currency } from '#types/enum/currency_code';
import { DateTime } from 'luxon';

export type StockPriceDto = {
  currency: Currency;
  price: number;
  vatAmount: number;
  vatRate: number;
};

type StockPhoto = {
  url: string;
  name?: string;
};

export type StockItemSummaryDto = {
  itemId: string;
  sku: string | null;
  name: string;
  prices: Array<StockPriceDto>;
  availableQty: number;
  thumbnail: StockPhoto;
  createdAt: DateTime;
  updatedAt: DateTime;
};

type StockItemFields = {
  prices: Array<StockPriceDto>;
  name: string;
  itemDescription: string;
  size?: string;
  availableQty: number;
  photos: Array<StockPhoto>;
};

export type StockItemDataDto = StockItemFields & {
  itemId: string;
  sku: string | null;
};

export type StockItemCreateDto = StockItemFields & {
  itemId?: string;
  sku?: string;
  color: string;
};

export type StockItemUpdateDto = StockItemFields;

export type StockItemCreatedDto = {
  itemId: string;
};

export type StockItemDb = {
  itemId: string;
  sku: string | null;
  prices: Array<StockPriceDto>;
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
