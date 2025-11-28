import { CountryCode } from '#types/enum/countryCode';

export type Address = {
  streetName: string;
  streetNumber: string;
  apartmentNumber?: string;
  city: string;
  postalCode: string;
  region?: string;
  countryCode: CountryCode;
};
