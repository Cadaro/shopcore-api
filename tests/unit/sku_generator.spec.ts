import { test } from '@japa/runner';
import { generateFixedSKU, generateUniqueSKU } from '#common/sku_generator';

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

  test('retries collisions and returns the first available SKU', async ({ assert }) => {
    let lookups = 0;
    let availableSku = '';
    const sku = await generateUniqueSKU('item-1', 'Hat', 'blue', 'M', async (candidate) => {
      lookups++;
      if (lookups < 5) return true;
      availableSku = candidate;
      return false;
    });

    assert.equal(sku, availableSku);
    assert.match(sku, /^HATBLMX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/);
    assert.equal(lookups, 5);
  });

  test('fails after five colliding SKU attempts', async ({ assert }) => {
    let lookups = 0;
    await assert.rejects(async () => {
      await generateUniqueSKU('item-1', 'Hat', 'blue', 'M', async () => {
        lookups++;
        return true;
      });
    }, /Could not generate a unique SKU for stock item item-1/);
    assert.equal(lookups, 5);
  });
});
