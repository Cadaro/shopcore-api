import { randomUUID } from 'node:crypto';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import MoneyMigration from '../../../database/migrations/1793040028001_store_money_as_minor_units.js';

test.group('Money migration', () => {
  test('converts legacy values, resumes safely, and guards and restores rollback', async ({
    assert,
  }) => {
    const prefix = `money_test_${randomUUID().slice(0, 8)}_`;
    const tables = ['stocks', 'order_details', 'order_invoice_details', 'orders'];
    class TestMigration extends MoneyMigration {
      protected get moneyColumns() {
        return super.moneyColumns.map((column) => ({ ...column, table: prefix + column.table }));
      }
    }

    try {
      await db.connection().schema.createTable(prefix + 'stocks', (table) => {
        table.float('price', 8, 2).notNullable();
        table.float('vat_amount', 8, 2).notNullable().defaultTo(0);
      });
      await db.connection().schema.createTable(prefix + 'order_details', (table) => {
        table.float('item_price', 8, 2).notNullable();
        table.float('vat_amount', 8, 2).notNullable();
      });
      await db.connection().schema.createTable(prefix + 'order_invoice_details', (table) => {
        table.float('price_gross', 8, 2).notNullable();
        table.float('vat_amount', 8, 2).notNullable();
      });
      await db.connection().schema.createTable(prefix + 'orders', (table) => {
        table.decimal('delivery_price', 10, 2).notNullable();
      });
      await db.table(prefix + 'stocks').insert({ price: 23.99, vat_amount: 4.99 });
      await db.table(prefix + 'order_details').insert({ item_price: 0.1, vat_amount: 0.02 });
      await db
        .table(prefix + 'order_invoice_details')
        .insert({ price_gross: 23.99, vat_amount: 4.99 });
      await db.table(prefix + 'orders').insert({ delivery_price: 12.99 });

      await new TestMigration(db.connection(), 'money-test').execUp();
      await new TestMigration(db.connection(), 'money-test').execUp();
      const stock = await db.from(prefix + 'stocks').first();
      const order = await db.from(prefix + 'orders').first();
      const detail = await db.from(prefix + 'order_details').first();
      const invoice = await db.from(prefix + 'order_invoice_details').first();
      assert.equal(Number(stock.price), 2399);
      assert.equal(Number(stock.vat_amount), 499);
      assert.equal(Number(order.delivery_price), 1299);
      assert.equal(Number(detail.item_price), 10);
      assert.equal(Number(detail.vat_amount), 2);
      assert.equal(Number(invoice.price_gross), 2399);
      assert.equal(Number(invoice.vat_amount), 499);

      await db.from(prefix + 'stocks').update({ price: 100000000 });
      await assert.rejects(() => new TestMigration(db.connection(), 'money-test').execDown());
      assert.equal(Number((await db.from(prefix + 'orders').first()).delivery_price), 1299);
      await db.from(prefix + 'stocks').update({ price: 2399 });
      await new TestMigration(db.connection(), 'money-test').execDown();
      assert.equal(Number((await db.from(prefix + 'stocks').first()).price), 23.99);
      assert.equal(Number((await db.from(prefix + 'orders').first()).delivery_price), 12.99);
      assert.equal(Number((await db.from(prefix + 'order_details').first()).vat_amount), 0.02);
      assert.equal(
        Number((await db.from(prefix + 'order_invoice_details').first()).price_gross),
        23.99
      );
    } finally {
      for (const table of tables) await db.connection().schema.dropTableIfExists(prefix + table);
    }
  });
});
