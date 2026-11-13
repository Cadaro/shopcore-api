import { Currency } from '#types/enum/currency_code';
import vine from '@vinejs/vine';

const stockFields = {
  prices: vine
    .array(
      vine.object({
        currency: vine.enum(Currency),
        price: vine.number({ strict: true }).positive().decimal(2).min(0.01).max(999999999999.99),
        vatRate: vine.number({ strict: true }).positive(),
        vatAmount: vine.number({ strict: true }).positive().decimal(2).max(999999999999.99),
      })
    )
    .minLength(1)
    .distinct('currency'),
  name: vine.string().minLength(3).maxLength(100),
  itemDescription: vine.string().minLength(3).maxLength(4000),
  availableQty: vine.number({ strict: true }).positive().withoutDecimals(),
  photos: vine.array(
    vine.object({
      url: vine.string(),
      name: vine.string().optional(),
    })
  ),
  size: vine.string().optional(),
};

export const createStockValidator = vine.create(
  vine.object({
    itemId: vine.string().optional(),
    ...stockFields,
    color: vine.string().trim().minLength(1),
  })
);

export const updateStockValidator = vine.create(vine.object(stockFields));
