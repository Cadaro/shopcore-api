import { randomUUID } from 'node:crypto';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import StockVersionMigration from '../../../database/migrations/1794755737002_add_stock_version.js';

test.group('Stock version migration', () => {
  test('initializes existing and new rows and rolls back', async ({ assert }) => {
    const tableName = `stock_version_${randomUUID().slice(0, 8)}`;
    class TestMigration extends StockVersionMigration {
      protected tableName = tableName;
    }

    try {
      await db.connection().schema.createTable(tableName, (table) => {
        table.increments('id').primary();
      });
      await db.table(tableName).insert({});
      await new TestMigration(db.connection(), 'stock-version-test').execUp();
      await db.table(tableName).insert({});
      const rows = await db.from(tableName).orderBy('id');
      assert.deepEqual(
        rows.map((row) => row.version),
        [1, 1]
      );
      await assert.rejects(() => db.table(tableName).insert({ version: null }));
      await new TestMigration(db.connection(), 'stock-version-test').execDown();
      assert.isFalse(await db.connection().schema.hasColumn(tableName, 'version'));
      assert.lengthOf(await db.from(tableName), 2);
    } finally {
      await db.connection().schema.dropTableIfExists(tableName);
    }
  });
});
