import { CountryCode } from '#types/enum/countryCode';
import { postalCodeForCountry } from '#validators/validatorTypes/postalCodeValidator';
import vine from '@vinejs/vine';

export const Address = vine.object({
  streetName: vine.string().minLength(3).maxLength(50),
  streetNumber: vine.string().minLength(1).maxLength(10),
  apartmentNumber: vine.string().minLength(1).maxLength(10).optional(),
  city: vine.string().minLength(3).maxLength(50),
  postalCode: vine.string().maxLength(20).use(postalCodeForCountry()),
  region: vine.string().minLength(2).maxLength(50).optional(),
  countryCode: vine.enum(CountryCode),
});
