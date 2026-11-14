import { randomUUID } from 'node:crypto';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import StockSkuMigration from '../../../database/migrations/1794061805410_enforce_stock_sku.js';

test.group('Stock SKU migration', () => {
  test('backfills, normalizes, constrains and rolls back stock SKUs', async ({ assert }) => {
    const stocksTable = `stock_sku_test_${randomUUID().slice(0, 8)}_stocks`;
    class TestMigration extends StockSkuMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.bigIncrements('id').unsigned().primary();
        table.string('item_id').notNullable().unique();
        table.string('name').notNullable();
        table.string('size').nullable();
        table.string('sku').nullable().unique();
      });
      await db.table(stocksTable).insert([
        { item_id: 'missing-sku', name: 'Test Hoodie', size: 'M', sku: null },
        { item_id: 'empty-sku', name: 'Test Hoodie', size: 'M', sku: '' },
        { item_id: 'short-sku', name: 'Short Product', size: 'S', sku: 'SHORT' },
        { item_id: 'long-sku', name: 'Existing Product', size: 'L', sku: 'ABCDEFGHIJKL' },
      ]);

      await new TestMigration(db.connection(), 'stock-sku-test').execUp();

      const stocks = await db.from(stocksTable).select('item_id', 'sku');
      const skuByItemId = Object.fromEntries(stocks.map((stock) => [stock.item_id, stock.sku]));
      assert.match(skuByItemId['missing-sku'], /^TESNCMX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/);
      assert.match(skuByItemId['empty-sku'], /^TESNCMX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/);
      assert.match(skuByItemId['short-sku'], /^SHONCSX[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{3}$/);
      assert.equal(skuByItemId['long-sku'], 'ABCDEFGHIJ');
      assert.isTrue(stocks.every((stock) => Array.from(stock.sku).length === 10));

      await assert.rejects(() =>
        db.table(stocksTable).insert({
          item_id: 'invalid-short',
          name: 'Invalid SKU',
          size: 'M',
          sku: 'SHORT',
        })
      );
      await assert.rejects(() =>
        db.table(stocksTable).insert({
          item_id: 'invalid-null',
          name: 'Invalid SKU',
          size: 'M',
          sku: null,
        })
      );

      await new TestMigration(db.connection(), 'stock-sku-test').execDown();
      await db.table(stocksTable).insert({
        item_id: 'nullable-sku',
        name: 'Legacy Stock',
        size: 'M',
        sku: null,
      });
      await assert.rejects(() =>
        db.table(stocksTable).insert({
          item_id: 'duplicate-sku',
          name: 'Legacy Stock',
          size: 'M',
          sku: 'ABCDEFGHIJ',
        })
      );
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });

  test('fails rollback clearly when duplicate SKUs prevent restoring global uniqueness', async ({
    assert,
  }) => {
    const stocksTable = `stock_sku_rollback_${randomUUID().slice(0, 8)}_stocks`;
    class TestMigration extends StockSkuMigration {
      protected tableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.bigIncrements('id').unsigned().primary();
        table.string('item_id').notNullable().unique();
        table.string('name').notNullable();
        table.string('size').nullable();
        table.string('sku').nullable().unique();
      });
      await db.table(stocksTable).insert({
        item_id: 'stock-before-migration',
        name: 'Test Hoodie',
        size: 'M',
        sku: null,
      });
      await new TestMigration(db.connection(), 'stock-sku-rollback-test').execUp();
      await db.table(stocksTable).insert([
        {
          item_id: 'duplicate-one',
          name: 'Duplicate Stock',
          size: 'M',
          sku: 'DUPLICATE1',
        },
        {
          item_id: 'duplicate-two',
          name: 'Duplicate Stock',
          size: 'M',
          sku: 'DUPLICATE1',
        },
      ]);

      await assert.rejects(async () => {
        await new TestMigration(db.connection(), 'stock-sku-rollback-test').execDown();
      }, /Cannot roll back stock SKU migration: 1 duplicate SKU values/);
    } finally {
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });
});
