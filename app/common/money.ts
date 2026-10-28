const MAX_MINOR = 99_999_999_999_999n;

function decimalParts(value: number | string): { numerator: bigint; denominator: bigint } {
  const text = String(value);
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text);
  if (!match) throw new RangeError(`Invalid decimal value: ${text}`);
  const fraction = match[3] ?? '';
  const exponent = Number(match[4] ?? 0);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) {
    throw new RangeError(`Decimal exponent out of range: ${text}`);
  }
  const scale = fraction.length - exponent;
  const sign = match[1] === '-' ? -1n : 1n;
  const digits = sign * BigInt(match[2] + fraction);
  return scale >= 0
    ? { numerator: digits, denominator: 10n ** BigInt(scale) }
    : { numerator: digits * 10n ** BigInt(-scale), denominator: 1n };
}

function divideRounded(numerator: bigint, denominator: bigint): bigint {
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  return sign * ((absolute * 2n + denominator) / (denominator * 2n));
}

function checkedMinor(value: bigint): bigint {
  if (value > MAX_MINOR || value < -MAX_MINOR) {
    throw new RangeError('Money amount exceeds the supported range');
  }
  return value;
}

/** Convert major units to minor units, rounding ties away from zero. */
export function toMinor(value: number | string): bigint {
  const { numerator, denominator } = decimalParts(value);
  return checkedMinor(divideRounded(numerator * 100n, denominator));
}

/** Convert integer minor units to the API's major-unit number. */
export function fromMinor(value: bigint | number | string): number {
  const minor = checkedMinor(BigInt(value));
  const sign = minor < 0n ? '-' : '';
  const absolute = minor < 0n ? -minor : minor;
  return Number(`${sign}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`);
}

/** VAT on a net minor-unit amount; rate is a decimal fraction (e.g. 0.23). */
export function vatForNet(net: bigint, rate: number | string): bigint {
  checkedMinor(net);
  const { numerator, denominator } = decimalParts(rate);
  return checkedMinor(divideRounded(net * numerator, denominator));
}

export function sumLineAmounts(lines: Array<{ amount: number; qty: number }>): number {
  const total = lines.reduce((sum, line) => {
    if (!Number.isSafeInteger(line.qty) || line.qty < 0) {
      throw new RangeError('Quantity must be a non-negative safe integer');
    }
    return checkedMinor(sum + toMinor(line.amount) * BigInt(line.qty));
  }, 0n);
  return fromMinor(total);
}
