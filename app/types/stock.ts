import { Currency } from '#types/enum/currency_code';

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
};

export type StockItemDataDto = {
  itemId: string;
  sku: string | null;
  prices: Array<StockPriceDto>;
  name: string;
  itemDescription: string;
  size?: string;
  availableQty: number;
  photos: Array<StockPhoto>;
};

export type StockItemCreateDto = {
  itemId?: string;
  sku?: string;
  prices: Array<StockPriceDto>;
  name: string;
  itemDescription: string;
  size?: string;
  availableQty: number;
  photos: Array<StockPhoto>;
};

export type StockItemUpdateDto = Omit<StockItemCreateDto, 'itemId'>;

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
