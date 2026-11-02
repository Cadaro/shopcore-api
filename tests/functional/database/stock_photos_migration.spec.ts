import { randomUUID } from 'node:crypto';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import StockPhotosMigration from '../../../database/migrations/1793500000001_replace_stock_photos_item_id_with_stock_id.js';

test.group('Stock photos migration', () => {
  test('preserves associations, cascades deletes, and rolls back cleanly', async ({ assert }) => {
    const prefix = `stock_photo_test_${randomUUID().slice(0, 8)}_`;
    const stocksTable = `${prefix}stocks`;
    const photosTable = `${prefix}photos`;
    class TestMigration extends StockPhotosMigration {
      protected stockPhotosTableName = photosTable;
      protected stocksTableName = stocksTable;
    }

    try {
      await db.connection().schema.createTable(stocksTable, (table) => {
        table.bigIncrements('id').unsigned().primary();
        table.string('item_id').notNullable().unique();
      });
      await db.connection().schema.createTable(photosTable, (table) => {
        table.bigIncrements('id').unsigned().primary();
        table.string('item_id').notNullable().index();
        table.string('url').notNullable();
        table.string('name').nullable();
        table
          .foreign('item_id', `${photosTable}_item_id_foreign`)
          .references('item_id')
          .inTable(stocksTable)
          .onDelete('CASCADE');
      });

      await db.table(stocksTable).insert({ item_id: 'first-stock' });
      await db.table(stocksTable).insert({ item_id: 'second-stock' });
      const firstStockId = Number(
        (await db.from(stocksTable).where('item_id', 'first-stock').first()).id
      );
      const secondStockId = Number(
        (await db.from(stocksTable).where('item_id', 'second-stock').first()).id
      );
      await db.table(photosTable).insert([
        { item_id: 'first-stock', url: '/first-a.jpg', name: 'First A' },
        { item_id: 'first-stock', url: '/first-b.jpg', name: 'First B' },
        { item_id: 'second-stock', url: '/second.jpg', name: 'Second' },
      ]);

      await new TestMigration(db.connection(), 'stock-photos-test').execUp();
      const migratedPhotos = await db.from(photosTable).select('stock_id').orderBy('id');
      assert.deepEqual(
        migratedPhotos.map((photo) => Number(photo.stock_id)),
        [Number(firstStockId), Number(firstStockId), Number(secondStockId)]
      );
      assert.isFalse(await db.connection().schema.hasColumn(photosTable, 'item_id'));

      await db.from(stocksTable).where('id', secondStockId).delete();
      assert.equal(
        await db
          .from(photosTable)
          .where('stock_id', secondStockId)
          .count('* as count')
          .then((rows) => Number(rows[0].count)),
        0
      );

      await new TestMigration(db.connection(), 'stock-photos-test').execDown();
      const rolledBackPhotos = await db.from(photosTable).select('item_id').orderBy('id');
      assert.deepEqual(
        rolledBackPhotos.map((photo) => photo.item_id),
        ['first-stock', 'first-stock']
      );
      assert.isFalse(await db.connection().schema.hasColumn(photosTable, 'stock_id'));
      assert.equal(
        Number((await db.from(stocksTable).where('id', firstStockId).count('* as count'))[0].count),
        1
      );
    } finally {
      await db.connection().schema.dropTableIfExists(photosTable);
      await db.connection().schema.dropTableIfExists(stocksTable);
    }
  });
});
