import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected stockPhotosTableName = 'stock_photos';
  protected stocksTableName = 'stocks';

  async up() {
    this.defer(async (db) => {
      const unlinkedPhotos = await db
        .from(`${this.stockPhotosTableName} as photo`)
        .leftJoin(`${this.stocksTableName} as stock`, 'stock.item_id', 'photo.item_id')
        .whereNull('stock.id')
        .count('* as count');
      const count = Number(unlinkedPhotos[0]?.count ?? 0);
      if (count > 0) {
        throw new Error(
          `Cannot migrate stock photos: ${count} photos do not match a stock item. Correct these rows and rerun the migration; no rows were changed.`
        );
      }
    });

    this.schema.alterTable(this.stockPhotosTableName, (table) => {
      table
        .bigInteger('stock_id')
        .unsigned()
        .nullable()
        .index(`${this.stockPhotosTableName}_stock_id_index`);
    });

    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE ${this.stockPhotosTableName} AS photo
         INNER JOIN ${this.stocksTableName} AS stock ON stock.item_id = photo.item_id
         SET photo.stock_id = stock.id
         WHERE photo.stock_id IS NULL`
      );

      const unlinkedPhotos = await db
        .from(this.stockPhotosTableName)
        .whereNull('stock_id')
        .count('* as count');
      const count = Number(unlinkedPhotos[0]?.count ?? 0);
      if (count > 0) {
        throw new Error(
          `Cannot migrate stock photos: ${count} photos do not match a stock item. Correct these rows and rerun the migration; no legacy columns were removed.`
        );
      }

      await db.schema.alterTable(this.stockPhotosTableName, (table) => {
        table
          .foreign('stock_id', `${this.stockPhotosTableName}_stock_id_fk`)
          .references('id')
          .inTable(this.stocksTableName)
          .onDelete('CASCADE');
      });

      await db.schema.alterTable(this.stockPhotosTableName, (table) => {
        table.bigInteger('stock_id').unsigned().notNullable().alter();
      });

      await db.schema.alterTable(this.stockPhotosTableName, (table) => {
        table.dropForeign('item_id');
        table.dropIndex('item_id');
        table.dropColumn('item_id');
      });
    });
  }

  async down() {
    this.schema.alterTable(this.stockPhotosTableName, (table) => {
      table.string('item_id').nullable().index(`${this.stockPhotosTableName}_item_id_index`);
    });

    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE ${this.stockPhotosTableName} AS photo
         INNER JOIN ${this.stocksTableName} AS stock ON stock.id = photo.stock_id
         SET photo.item_id = stock.item_id
         WHERE photo.item_id IS NULL`
      );

      const unlinkedPhotos = await db
        .from(this.stockPhotosTableName)
        .whereNull('item_id')
        .count('* as count');
      const count = Number(unlinkedPhotos[0]?.count ?? 0);
      if (count > 0) {
        throw new Error(
          `Cannot roll back stock photos: ${count} photos do not match a stock item. Correct these rows and rerun the rollback; no stock_id columns were removed.`
        );
      }

      await db.schema.alterTable(this.stockPhotosTableName, (table) => {
        table
          .foreign('item_id', `${this.stockPhotosTableName}_item_id_foreign`)
          .references('item_id')
          .inTable(this.stocksTableName)
          .onDelete('CASCADE');
      });

      await db.schema.alterTable(this.stockPhotosTableName, (table) => {
        table.string('item_id').notNullable().alter();
      });

      await db.schema.alterTable(this.stockPhotosTableName, (table) => {
        table.dropForeign('stock_id', `${this.stockPhotosTableName}_stock_id_fk`);
        table.dropIndex('stock_id', `${this.stockPhotosTableName}_stock_id_index`);
        table.dropColumn('stock_id');
      });
    });
  }
}
