import { test } from '@japa/runner';
import { fromMinor, sumLineAmounts, toMinor, vatForNet } from '#common/money';

test.group('Money', () => {
  test('converts and rounds decimal values without binary floating-point arithmetic', ({
    assert,
  }) => {
    assert.equal(toMinor(0.1), 10n);
    assert.equal(toMinor('1.005'), 101n);
    assert.equal(toMinor('-1.005'), -101n);
    assert.equal(toMinor('1.0049'), 100n);
    assert.equal(toMinor(1e-3), 0n);
    assert.equal(fromMinor('2399'), 23.99);
    assert.equal(fromMinor(-1n), -0.01);
  });

  test('sums line amounts and calculates VAT in minor units', ({ assert }) => {
    assert.equal(
      sumLineAmounts([
        { amount: 0.1, qty: 3 },
        { amount: 0.2, qty: 1 },
      ]),
      0.5
    );
    assert.equal(vatForNet(1001n, '0.23'), 230n);
    assert.equal(vatForNet(50n, '0.01'), 1n);
    assert.equal(vatForNet(-50n, '0.01'), -1n);
  });

  test('rejects invalid numbers, quantities and out-of-range amounts', ({ assert }) => {
    assert.throws(() => toMinor(Number.NaN), RangeError);
    assert.throws(() => toMinor('1000000000000'), RangeError);
    assert.throws(() => sumLineAmounts([{ amount: 1, qty: 1.5 }]), RangeError);
    assert.throws(() => sumLineAmounts([{ amount: 999999999999.99, qty: 2 }]), RangeError);
  });
});
