import { randomUUID } from 'node:crypto';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import VatMigration from '../../../database/migrations/1793500000002_move_vat_to_stock_prices.js';

test.group('VAT migration', () => {
  test('backfills each price and restores legacy VAT on rollback', async ({ assert }) => {
    const prefix = `vat_test_${randomUUID().slice(0, 8)}_`;
    const stocksTable = `${prefix}stocks`;
    const stockPricesTable = `${prefix}stock_prices`;
    class TestMigration extends VatMigration {
      protected stocksTableName = stocksTable;
      protected stockPricesTableName = stockPricesTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.bigIncrements('id').unsigned().primary();
        table.decimal('vat_amount', 14, 0).notNullable();
        table.float('vat_rate').notNullable();
      });
      await db.connection().schema.createTable(stockPricesTable, (table) => {
        table.bigIncrements('id').unsigned().primary();
        table.bigInteger('stock_id').unsigned().notNullable();
        table.string('currency', 3).notNullable();
        table.decimal('price', 14, 0).notNullable();
      });

      await db.table(stocksTable).insert({ vat_amount: 209, vat_rate: 0.21 });
      const stockId = Number((await db.from(stocksTable).first()).id);
      await db.table(stockPricesTable).insert([
        { stock_id: stockId, currency: 'EUR', price: 999 },
        { stock_id: stockId, currency: 'PLN', price: 4299 },
      ]);

      await new TestMigration(db.connection(), 'vat-test').execUp();
      assert.isFalse(await db.connection().schema.hasColumn(stocksTable, 'vat_amount'));
      assert.isFalse(await db.connection().schema.hasColumn(stocksTable, 'vat_rate'));
      const migratedPrices = await db.from(stockPricesTable).select('vat_amount', 'vat_rate');
      assert.deepEqual(
        migratedPrices.map((price) => [Number(price.vat_amount), Number(price.vat_rate)]),
        [
          [209, 0.21],
          [209, 0.21],
        ]
      );

      await db.from(stockPricesTable).where('currency', 'PLN').update({
        vat_amount: 901,
        vat_rate: 0.23,
      });
      await new TestMigration(db.connection(), 'vat-test').execDown();
      assert.isFalse(await db.connection().schema.hasColumn(stockPricesTable, 'vat_amount'));
      assert.isFalse(await db.connection().schema.hasColumn(stockPricesTable, 'vat_rate'));
      const restoredStock = await db.from(stocksTable).first();
      assert.equal(Number(restoredStock.vat_amount), 209);
      assert.equal(Number(restoredStock.vat_rate), 0.21);
    } finally {
      await db.connection().schema.dropTableIfExists(stockPricesTable);
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });
});
