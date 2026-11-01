import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'stock_prices';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').unsigned().notNullable().primary();
      table
        .bigInteger('stock_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('stocks')
        .onDelete('CASCADE');
      table.string('currency', 3).notNullable();
      table.decimal('price', 14, 0).notNullable().comment('gross price in minor units');
      table.timestamp('created_at');
      table.timestamp('updated_at');
      table.unique(['stock_id', 'currency']);
    });

    // Legacy single price becomes the first price row, in minor units already
    this.defer(async (db) => {
      await db.rawQuery(
        `INSERT INTO stock_prices (stock_id, currency, price, created_at, updated_at)
         SELECT id, price_currency, price, NOW(), NOW() FROM stocks`
      );
    });

    this.schema.alterTable('stocks', (table) => {
      table.dropColumns('price', 'price_currency');
    });
  }

  async down() {
    this.schema.alterTable('stocks', (table) => {
      table.decimal('price', 14, 0).notNullable().defaultTo(0);
      table.string('price_currency').notNullable().defaultTo('');
    });

    // Restore the earliest price of each stock as the legacy single price
    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE stocks s JOIN stock_prices p
           ON p.id = (SELECT MIN(id) FROM stock_prices WHERE stock_id = s.id)
         SET s.price = p.price, s.price_currency = p.currency`
      );
    });

    this.schema.dropTable(this.tableName);
  }
}
