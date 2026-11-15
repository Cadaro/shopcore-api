import { test } from '@japa/runner';
import { generateFixedSKU } from '#common/sku_generator';

test.group('SKU generator', () => {
  test('generates normalized 12-character SKUs with known color and size mappings', ({
    assert,
  }) => {
    const sku = generateFixedSKU('Blue Hoodie', 'black', 'S');

    assert.match(
      sku,
      /^BL[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-BK[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-S$/
    );
  });

  test('generates normalized 14-character SKUs with known color and size mappings', ({
    assert,
  }) => {
    const sku = generateFixedSKU('Hoodie', 'black', 'XXL');

    assert.match(
      sku,
      /^HO[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-BK[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-XXL$/
    );
  });

  test('generates normalized 17-character SKUs with known color and size mappings', ({
    assert,
  }) => {
    const sku = generateFixedSKU('t-shirt', 'yellow', '104/110');

    assert.match(
      sku,
      /^TS[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-YE[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-104110$/
    );
  });

  test('pads short product names and uses fallback segments for empty sanitized values', ({
    assert,
  }) => {
    assert.match(
      generateFixedSKU('TV', '!!!', '!!!'),
      /^TV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-XX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-NS$/
    );
    assert.match(
      generateFixedSKU('TV', 'constructor', 'M'),
      /^TV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-CO[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-M$/
    );
  });

  test('supports no-size and omitted size values', ({ assert }) => {
    assert.match(
      generateFixedSKU('Hat', 'blue', 'no-size'),
      /^HA[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-BL[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-NS$/
    );
    assert.match(
      generateFixedSKU('Hat', 'blue'),
      /^HA[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-BL[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-NS$/
    );
  });

  test('uses the NOCOLOR dictionary value for legacy missing colors', ({ assert }) => {
    assert.match(
      generateFixedSKU('Hat', 'NOCOLOR', 'M'),
      /^HA[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-NC[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-M$/
    );
  });

  test('varies the random segments for identical product variants', ({ assert }) => {
    const skus = Array.from({ length: 10 }, () => generateFixedSKU('Hoodie', 'black', 'M'));
    assert.isAbove(new Set(skus).size, 1);
  });
});
