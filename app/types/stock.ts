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
  sku: string;
  name: string;
  color: string;
  prices: Array<StockPriceDto>;
  availableQty: number;
  thumbnail: StockPhoto;
  createdAt: DateTime;
  updatedAt: DateTime;
};

type AdminStockFields = {
  isVisible: boolean;
  deletedAt: DateTime | null;
};

export type AdminStockItemSummaryDto = StockItemSummaryDto & AdminStockFields;

type StockItemFields = {
  prices: Array<StockPriceDto>;
  name: string;
  itemDescription: string;
  size?: string;
  availableQty: number;
  photos: Array<StockPhoto>;
};

type StockItemResponseFields = StockItemFields & {
  itemId: string;
  sku: string;
};

export type StockItemDataDto = StockItemResponseFields & {
  color: string;
};

export type AdminStockItemDataDto = StockItemDataDto & AdminStockFields;

export type StockItemUpdateResponseDto = StockItemResponseFields;

export type StockItemCreateDto = StockItemFields & {
  itemId?: string;
  color: string;
  isVisible: boolean;
};

export type StockItemUpdateDto = StockItemFields;

export type StockItemCreatedDto = {
  itemId: string;
};

export type StockItemDb = {
  itemId: string;
  sku: string;
  prices: Array<StockPriceDto>;
  name: string;
  itemDescription: string;
  size?: string;
  availableQty: number;
  photos: Array<StockPhoto>;
};

export type StockItemCreateDb = StockItemDb & {
  color: string;
  isVisible: boolean;
};

export type ItemWithQty = {
  itemId: string;
  qty: number;
};
