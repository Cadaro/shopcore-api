import { Address } from '#types/address';
import { Currency } from '#types/enum/currency_code';
import { DeliveryMethod } from '#types/enum/delivery_method';
import { CountryCode } from './enum/country_code.js';

export type DeliveryDataDto = {
  courier: string;
  method: DeliveryMethod;
  address?: Address;
  pickupPointId?: string;
  additionalNote?: string;
  deliveryPrice: number;
  deliveryVatRate: number;
  deliveryCurrency: Currency;
};

export type DeliveryAddressDb = {
  streetName: string;
  streetNumber: string;
  apartmentNumber?: string;
  city: string;
  postalCode: string;
  region?: string;
  countryCode: CountryCode;
};
