import { COLOR_DICTIONARY } from '#common/sku_color_dictionary';
import { randomInt } from 'node:crypto';

const RANDOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function normalizeSegment(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/gi, 'L')
    .replace(/Ł/gi, 'L')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function fitSegment(value: string, length: number) {
  return value.slice(0, length).padEnd(length, 'X');
}

function getRandomId(length: number) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += RANDOM_ALPHABET[randomInt(RANDOM_ALPHABET.length)];
  }
  return result;
}

export function generateFixedSKU(name: string, color: string, size?: string): string {
  const productSegment = fitSegment(normalizeSegment(name), 2);
  const normalizedColor = color.trim().toUpperCase();
  const mappedColor = Object.hasOwn(COLOR_DICTIONARY, normalizedColor)
    ? COLOR_DICTIONARY[normalizedColor]
    : undefined;
  const colorSegment = mappedColor ?? fitSegment(normalizeSegment(color), 2);
  const normalizedSize = normalizeSegment(size ?? '');
  const sizeSegment =
    !normalizedSize || normalizedSize === 'NOSIZE' ? 'NS' : normalizedSize.slice(0, 6);

  return `${productSegment}${getRandomId(3)}-${colorSegment}${getRandomId(2)}-${sizeSegment}`;
}
