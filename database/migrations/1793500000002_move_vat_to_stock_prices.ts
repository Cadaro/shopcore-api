import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected stocksTableName = 'stocks';
  protected stockPricesTableName = 'stock_prices';

  async up() {
    this.schema.alterTable(this.stockPricesTableName, (table) => {
      table.decimal('vat_amount', 14, 0).notNullable().defaultTo(0);
      table.float('vat_rate').notNullable().defaultTo(0);
    });

    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE ?? p JOIN ?? s ON p.stock_id = s.id
         SET p.vat_amount = s.vat_amount, p.vat_rate = s.vat_rate`,
        [this.stockPricesTableName, this.stocksTableName]
      );
    });

    this.schema.alterTable(this.stocksTableName, (table) => {
      table.dropColumns('vat_amount', 'vat_rate');
    });
  }

  async down() {
    this.schema.alterTable(this.stocksTableName, (table) => {
      table.decimal('vat_amount', 14, 0).notNullable().defaultTo(0);
      table.float('vat_rate').notNullable().defaultTo(0);
    });

    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE ?? s JOIN ?? p
           ON p.id = (SELECT MIN(id) FROM ?? WHERE stock_id = s.id)
         SET s.vat_amount = p.vat_amount, s.vat_rate = p.vat_rate`,
        [this.stocksTableName, this.stockPricesTableName, this.stockPricesTableName]
      );
    });

    this.schema.alterTable(this.stockPricesTableName, (table) => {
      table.dropColumns('vat_amount', 'vat_rate');
    });
  }
}
