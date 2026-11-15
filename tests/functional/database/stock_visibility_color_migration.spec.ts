import { randomUUID } from 'node:crypto';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import StockVisibilityColorMigration from '../../../database/migrations/1794664102636_add_stock_visibility_and_color.js';

test.group('Stock visibility and color migration', () => {
  test('backfills existing stocks, sets defaults and rolls back', async ({ assert }) => {
    const stocksTable = `stock_fields_${randomUUID().slice(0, 8)}`;
    class TestMigration extends StockVisibilityColorMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
      });
      await db.table(stocksTable).insert({ name: 'Existing stock' });
      await new TestMigration(db.connection(), 'stock-fields-test').execUp();

      const existing = await db.from(stocksTable).where('name', 'Existing stock').first();
      assert.equal(Number(existing.is_visible), 1);
      assert.equal(existing.color, 'NOCOLOR');

      await db.table(stocksTable).insert({ name: 'New stock' });
      const created = await db.from(stocksTable).where('name', 'New stock').first();
      assert.equal(Number(created.is_visible), 0);

      await new TestMigration(db.connection(), 'stock-fields-test').execDown();
      assert.isFalse(await db.connection().schema.hasColumn(stocksTable, 'is_visible'));
      assert.isFalse(await db.connection().schema.hasColumn(stocksTable, 'color'));
      assert.lengthOf(await db.from(stocksTable).select('id'), 2);
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });
});
