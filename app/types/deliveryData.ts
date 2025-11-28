import { Address } from '#types/address';
import { Currency } from '#types/enum/currencyCode';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import { CountryCode } from './enum/countryCode.js';

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
