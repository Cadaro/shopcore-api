import { randomUUID } from 'node:crypto';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import StockAvailableQtyMigration from '../../../database/migrations/1794755737001_require_stock_available_qty.js';

test.group('Stock available quantity migration', () => {
  test('requires a value and rolls back without deleting stock rows', async ({ assert }) => {
    const stocksTable = `stock_available_qty_${randomUUID().slice(0, 8)}`;
    class TestMigration extends StockAvailableQtyMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.increments('id').primary();
        table.integer('available_qty').nullable();
      });
      await db.table(stocksTable).insert({ available_qty: 0 });
      await new TestMigration(db.connection(), 'stock-available-qty-test').execUp();

      await assert.rejects(async () => {
        await db.table(stocksTable).insert({ available_qty: null });
      });

      await new TestMigration(db.connection(), 'stock-available-qty-test').execDown();
      await db.table(stocksTable).insert({ available_qty: null });
      assert.lengthOf(await db.from(stocksTable).select('id'), 2);
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });

  test('fails without changing rows when null quantities already exist', async ({ assert }) => {
    const stocksTable = `stock_available_qty_${randomUUID().slice(0, 8)}`;
    class TestMigration extends StockAvailableQtyMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.increments('id').primary();
        table.integer('available_qty').nullable();
      });
      await db.table(stocksTable).insert({ available_qty: null });

      await assert.rejects(async () => {
        await new TestMigration(db.connection(), 'stock-available-qty-null-test').execUp();
      }, /1 stock rows have a NULL quantity/);

      await db.table(stocksTable).insert({ available_qty: null });
      assert.lengthOf(await db.from(stocksTable).select('id'), 2);
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });
});
