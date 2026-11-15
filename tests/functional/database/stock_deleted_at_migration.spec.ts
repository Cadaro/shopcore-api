import { randomUUID } from 'node:crypto';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import StockDeletedAtMigration from '../../../database/migrations/1794755737000_add_deleted_at_to_stocks.js';

test.group('Stock deleted_at migration', () => {
  test('adds a nullable column and rolls back without deleting stock rows', async ({ assert }) => {
    const stocksTable = `stock_deleted_at_${randomUUID().slice(0, 8)}`;
    class TestMigration extends StockDeletedAtMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
      });
      await db.table(stocksTable).insert({ name: 'Existing stock' });
      await new TestMigration(db.connection(), 'stock-deleted-at-test').execUp();

      assert.isTrue(await db.connection().schema.hasColumn(stocksTable, 'deleted_at'));
      const existing = await db.from(stocksTable).where('name', 'Existing stock').first();
      assert.isNull(existing.deleted_at);

      await db.table(stocksTable).insert({ name: 'New stock' });
      const created = await db.from(stocksTable).where('name', 'New stock').first();
      assert.isNull(created.deleted_at);

      await new TestMigration(db.connection(), 'stock-deleted-at-test').execDown();
      assert.isFalse(await db.connection().schema.hasColumn(stocksTable, 'deleted_at'));
      assert.lengthOf(await db.from(stocksTable).select('id'), 2);
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });
});
