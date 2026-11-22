import { Currency } from '#types/enum/currency_code';
import { DomainRuleException } from '#exceptions/domain_exception';
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
    photos: stockFields.photos.clone().minLength(1),
    color: vine.string().trim().minLength(1).maxLength(30),
    isVisible: vine.boolean({ strict: true }),
  })
);

export const updateStockValidator = vine.create(
  vine.object({
    prices: stockFields.prices.clone().optional(),
    name: stockFields.name.clone().optional(),
    itemDescription: stockFields.itemDescription.clone().optional(),
    availableQty: vine.number({ strict: true }).min(0).withoutDecimals().optional(),
    photos: stockFields.photos.clone().minLength(1).optional(),
    isVisible: vine.boolean({ strict: true }).optional(),
  })
);

export function rejectEmptyStockUpdateValues(body: unknown): void {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return;
  const data = body as Record<string, unknown>;
  const fields = ['prices', 'name', 'itemDescription', 'availableQty', 'photos', 'isVisible'];
  const invalid = fields.find((field) => data[field] === null || data[field] === '');
  if (invalid) {
    throw new DomainRuleException('Invalid stock update', [
      { field: invalid, rule: 'required', message: 'Value cannot be null or empty' },
    ]);
  }
  if (Array.isArray(data.photos)) {
    for (const [index, photo] of data.photos.entries()) {
      if (photo && typeof photo === 'object' && !Array.isArray(photo)) {
        const name = (photo as Record<string, unknown>).name;
        if (name === null || name === '') {
          throw new DomainRuleException('Invalid stock update', [
            {
              field: `photos.${index}.name`,
              rule: 'required',
              message: 'Value cannot be null or empty',
            },
          ]);
        }
      }
    }
  }
}
