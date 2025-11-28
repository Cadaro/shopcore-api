import { Currency } from '#types/enum/currencyCode';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import vine, { SimpleMessagesProvider } from '@vinejs/vine';
import { Address } from '#validatorTypes/address';
import { PaymentMethod } from '#types/enum/paymentMethod';

export const createOrderDetailValidator = vine.compile(
  vine.object({
    firstName: vine.string().minLength(3).maxLength(50).optional().requiredIfMissing('companyName'),
    lastName: vine.string().minLength(3).maxLength(50).optional().requiredIfMissing('companyName'),
    companyName: vine
      .string()
      .minLength(3)
      .maxLength(100)
      .optional()
      .requiredIfMissing(['firstName', 'lastName']),
    email: vine.string().email(),
    phoneNumber: vine.string().minLength(7).maxLength(20),
    delivery: vine.object({
      courier: vine.string().minLength(3).maxLength(50),
      method: vine.enum(DeliveryMethod),
      address: Address.optional().requiredWhen('method', '=', DeliveryMethod.HOME_DELIVERY),
      pickupPointId: vine
        .string()
        .minLength(3)
        .maxLength(50)
        .optional()
        .requiredWhen('method', '=', DeliveryMethod.PICKUP_POINT),
      additionalNote: vine.string().maxLength(50).optional(),
      deliveryPrice: vine.number({ strict: true }).min(0),
      deliveryVatRate: vine.number({ strict: true }),
      deliveryCurrency: vine.enum(Currency),
    }),
    paymentMethod: vine.enum(PaymentMethod),
    items: vine
      .array(
        vine.object({
          itemId: vine.string(),
          itemName: vine.string(),
          qty: vine.number({ strict: true }).positive().withoutDecimals(),
          itemPrice: vine.number({ strict: true }).positive().decimal(2),
          currency: vine.enum(Currency),
          vatAmount: vine.number({ strict: true }).positive(),
          vatRate: vine.number({ strict: true }).positive(),
        })
      )
      .distinct('itemId')
      .notEmpty(),
  })
);

const message = {
  'required': 'The {{ field }} field is required',
  'firstName.required': 'The first name is required with last name',
  'lastName.required': 'The last name is required with first name',
  'companyName.required':
    'The company name is required when first name and last name are not provided',
  'delivery.address.required':
    'The delivery address is required when pickup point ID is not provided',
  'delivery.pickupPointId.required':
    'The pickup point ID is required when delivery address is not provided',
};

const fields = {
  'firstName': 'firstName',
  'lastName': 'lastName',
  'companyName': 'companyName',
  'email': 'email',
  'phoneNumber': 'phoneNumber',
  'delivery.courier': 'courier',
  'delivery.method': 'method',
  'delivery.address': 'address',
  'delivery.pickupPointId': 'pickupPointId',
  'delivery.additionalNote': 'additionalNote',
  'delivery.deliveryPrice': 'deliveryPrice',
  'delivery.currency': 'currency',
  'items.*.itemId': 'itemId',
  'items.*.itemName': 'itemName',
  'items.*.qty': 'qty',
  'items.*.itemPrice': 'itemPrice',
  'items.*.currency': 'currency',
  'items.*.vatAmount': 'vatAmount',
  'items.*.vatRate': 'vatRate',
};

createOrderDetailValidator.messagesProvider = new SimpleMessagesProvider(message, fields);
