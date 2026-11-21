import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'stocks';

  async up() {
    this.defer(async (db) => {
      const nullQuantities = await db
        .from(this.tableName)
        .whereNull('available_qty')
        .count('* as count');
      const nullCount = Number(nullQuantities[0]?.count ?? 0);

      if (nullCount > 0) {
        throw new Error(
          `Cannot make ${this.tableName}.available_qty NOT NULL: ${nullCount} stock rows have a NULL quantity. Set those quantities before rerunning the migration; no rows were changed.`
        );
      }

      await db.schema.alterTable(this.tableName, (table) => {
        table.integer('available_qty').notNullable().alter();
      });
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('available_qty').nullable().alter();
    });
  }
}
