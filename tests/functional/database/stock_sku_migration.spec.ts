import crypto, { randomUUID } from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { mock } from 'node:test';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import StockSkuMigration from '../../../database/migrations/1794664102635_update_sku_in_stocks_table.js';

test.group('Stock SKU migration', () => {
  test('regenerates all legacy SKUs uniquely and restores legacy constraints', async ({
    assert,
  }) => {
    const stocksTable = `stock_sku_test_${randomUUID().slice(0, 8)}_stocks`;
    class TestMigration extends StockSkuMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.charset('utf8mb4');
        table.collate('utf8mb4_general_ci');
        table.bigIncrements('id').unsigned().primary();
        table.string('item_id').notNullable().unique();
        table.string('name').notNullable();
        table.string('size').nullable();
        table.string('sku', 10).notNullable();
        table.check('CHAR_LENGTH(sku) = 10', [], `${stocksTable}_sku_length_check`);
      });
      await db.table(stocksTable).insert([
        { item_id: 'original', name: 'Test Hoodie', size: 'M', sku: 'LEGACYSKU1' },
        { item_id: 'duplicate', name: 'Test Hoodie', size: 'M', sku: 'LEGACYSKU1' },
        { item_id: 'case-duplicate', name: 'Test Hoodie', size: 'M', sku: 'legacysku1' },
        { item_id: 'blank', name: 'Short Product', size: 'S', sku: '          ' },
        { item_id: 'other', name: 'Existing Product', size: '104/110', sku: 'ABCDEFGHIJ' },
        { item_id: 'no-size', name: 'Hat', size: null, sku: 'LEGACYSKU2' },
      ]);

      await new TestMigration(db.connection(), 'stock-sku-test').execUp();

      const stocks = await db.from(stocksTable).select('item_id', 'sku');
      const skuByItemId = Object.fromEntries(stocks.map((stock) => [stock.item_id, stock.sku]));
      assert.match(
        skuByItemId.original,
        /^TE[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-NC[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-M$/
      );
      assert.match(
        skuByItemId.duplicate,
        /^TE[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-NC[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-M$/
      );
      assert.match(
        skuByItemId['case-duplicate'],
        /^TE[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-NC[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-M$/
      );
      assert.match(
        skuByItemId.blank,
        /^SH[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-NC[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-S$/
      );
      assert.match(
        skuByItemId.other,
        /^EX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-NC[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-104110$/
      );
      assert.match(
        skuByItemId['no-size'],
        /^HA[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}-NC[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}-NS$/
      );
      assert.equal(new Set(stocks.map((stock) => stock.sku)).size, stocks.length);
      assert.isTrue(
        stocks.every((stock) => /^[A-Z0-9]{5}-[A-Z0-9]{4}-[A-Z0-9]{1,6}$/.test(stock.sku))
      );
      assert.lengthOf(skuByItemId.original, 12);
      assert.lengthOf(skuByItemId.other, 17);

      await db.table(stocksTable).insert([
        { item_id: 'short', name: 'Short', size: 'M', sku: 'SHORT' },
        { item_id: 'max', name: 'Maximum', size: 'M', sku: '12345678901234567890' },
      ]);
      await assert.rejects(() =>
        db.table(stocksTable).insert({
          item_id: 'too-long',
          name: 'Invalid SKU',
          sku: '123456789012345678901',
        })
      );
      await assert.rejects(() =>
        db.table(stocksTable).insert({ item_id: 'null', name: 'Invalid SKU', sku: null })
      );
      await assert.rejects(() =>
        db.table(stocksTable).insert({
          item_id: 'duplicate-after',
          name: 'Invalid SKU',
          sku: skuByItemId.original,
        })
      );

      await new TestMigration(db.connection(), 'stock-sku-test').execDown();

      const rolledBack = await db.from(stocksTable).select('item_id', 'sku');
      const rolledBackByItemId = Object.fromEntries(
        rolledBack.map((stock) => [stock.item_id, stock.sku])
      );
      assert.isTrue(rolledBack.every((stock) => Array.from(stock.sku).length === 10));
      await db.table(stocksTable).insert({
        item_id: 'duplicate-after-rollback',
        name: 'Legacy Stock',
        sku: rolledBackByItemId.original,
      });
      await assert.rejects(() =>
        db.table(stocksTable).insert({ item_id: 'short-after', name: 'Invalid SKU', sku: 'SHORT' })
      );
      await assert.rejects(() =>
        db.table(stocksTable).insert({ item_id: 'null-after', name: 'Invalid SKU', sku: null })
      );
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });

  test('regenerates a SKU when the generated value collides within the migration', async ({
    assert,
  }) => {
    const stocksTable = `stock_sku_collision_${randomUUID().slice(0, 8)}_stocks`;
    class TestMigration extends StockSkuMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.bigIncrements('id').unsigned().primary();
        table.string('name').notNullable();
        table.string('size').nullable();
        table.string('sku', 10).notNullable();
        table.check('CHAR_LENGTH(sku) = 10', [], `${stocksTable}_sku_length_check`);
      });
      await db.table(stocksTable).insert([
        { name: 'Test Hoodie', size: 'M', sku: 'LEGACYSKU1' },
        { name: 'Test Hoodie', size: 'M', sku: 'LEGACYSKU1' },
      ]);

      let calls = 0;
      const randomInt = mock.method(crypto, 'randomInt', () => (calls++ < 10 ? 0 : 1));
      syncBuiltinESMExports();
      try {
        await new TestMigration(db.connection(), 'stock-sku-collision-test').execUp();
      } finally {
        randomInt.mock.restore();
        syncBuiltinESMExports();
      }

      const stocks = await db.from(stocksTable).orderBy('id').select('sku');
      assert.deepEqual(
        stocks.map((stock) => stock.sku),
        ['TEAAA-NCAA-M', 'TEBBB-NCBB-M']
      );
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });

  test('allows duplicate SKUs produced by rollback to the non-unique legacy schema', async ({
    assert,
  }) => {
    const stocksTable = `stock_sku_rollback_${randomUUID().slice(0, 8)}_stocks`;
    class TestMigration extends StockSkuMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.bigIncrements('id').unsigned().primary();
        table.string('name').notNullable();
        table.string('size').nullable();
        table.string('sku', 10).notNullable();
        table.check('CHAR_LENGTH(sku) = 10', [], `${stocksTable}_sku_length_check`);
      });
      await new TestMigration(db.connection(), 'stock-sku-rollback-test').execUp();
      await db.table(stocksTable).insert([
        { name: 'Original', sku: 'ABCDEFGHIJ' },
        { name: 'Long', sku: 'ABCDEFGHIJ--A' },
      ]);

      await new TestMigration(db.connection(), 'stock-sku-rollback-test').execDown();

      const stocks = await db.from(stocksTable).orderBy('id').select('sku');
      assert.deepEqual(
        stocks.map((stock) => stock.sku),
        ['ABCDEFGHIJ', 'ABCDEFGHIJ']
      );
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });
});
