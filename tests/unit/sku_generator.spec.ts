import { test } from '@japa/runner';
import { generateFixedSKU } from '#common/sku_generator';

test.group('SKU generator', () => {
  test('generates normalized 10-character SKUs with known color and size mappings', ({
    assert,
  }) => {
    const sku = generateFixedSKU('Blúe Hoodie', 'black', 'S');

    assert.match(sku, /^BLUBKSX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/);
  });

  test('pads short product names and uses fallback segments for empty sanitized values', ({
    assert,
  }) => {
    assert.match(
      generateFixedSKU('TV', '!!!', '!!!'),
      /^TVXXXXX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/
    );
    assert.match(
      generateFixedSKU('TV', 'constructor', 'M'),
      /^TVXCOMX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/
    );
  });

  test('supports no-size and omitted size values', ({ assert }) => {
    assert.match(
      generateFixedSKU('Hat', 'blue', 'no-size'),
      /^HATBLNS[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/
    );
    assert.match(generateFixedSKU('Hat', 'blue'), /^HATBLXX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/);
  });

  test('uses the NOCOLOR dictionary value for legacy missing colors', ({ assert }) => {
    assert.match(
      generateFixedSKU('Hat', 'NOCOLOR', 'M'),
      /^HATNCMX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/
    );
  });
});
