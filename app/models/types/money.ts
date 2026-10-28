import { fromMinor, toMinor } from '#common/money';

export const moneyColumn = {
  prepare: (value: number) => toMinor(value).toString(),
  consume: (value: string | number) => fromMinor(value),
};
