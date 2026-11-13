import { ConflictException } from '#exceptions/domain_exception';
import { COLOR_DICTIONARY } from '#common/sku_color_dictionary';
import { randomInt } from 'node:crypto';

const RANDOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_ATTEMPTS = 5;

function normalizeSegment(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function fitSegment(value: string, length: number) {
  return value.slice(0, length).padEnd(length, 'X');
}

export function generateFixedSKU(name: string, color: string, size?: string): string {
  const productSegment = fitSegment(normalizeSegment(name), 3);
  const normalizedColor = color.trim().toUpperCase();
  const mappedColor = Object.hasOwn(COLOR_DICTIONARY, normalizedColor)
    ? COLOR_DICTIONARY[normalizedColor]
    : undefined;
  const colorSegment = mappedColor ?? fitSegment(normalizeSegment(color), 2);
  const normalizedSize = size?.trim() ?? '';
  const sizeSegment =
    normalizedSize.toUpperCase() === 'NO-SIZE'
      ? 'NS'
      : normalizedSize.length === 0
        ? 'XX'
        : fitSegment(normalizeSegment(normalizedSize), 2);
  let suffix = '';

  for (let index = 0; index < 3; index++) {
    suffix += RANDOM_ALPHABET[randomInt(RANDOM_ALPHABET.length)];
  }

  return `${productSegment}${colorSegment}${sizeSegment}${suffix}`;
}

export async function generateUniqueSKU(
  itemId: string,
  name: string,
  color: string,
  size: string | undefined,
  isSkuTaken: (sku: string) => Promise<boolean>
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const sku = generateFixedSKU(name, color, size);
    if (await isSkuTaken(sku)) {
      continue;
    }
    return sku;
  }

  throw new ConflictException(`Could not generate a unique SKU for stock item ${itemId}`);
}
