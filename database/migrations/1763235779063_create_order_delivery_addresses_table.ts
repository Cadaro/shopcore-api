import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'order_delivery_addresses';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').unsigned().notNullable().primary();
      table
        .string('order_id', 255)
        .notNullable()
        .references('order_id')
        .inTable('orders')
        .onDelete('CASCADE');
      table.string('street_name', 50).notNullable();
      table.string('street_number', 10).notNullable();
      table.string('apartment_number', 10).nullable();
      table.string('city', 50).notNullable();
      table.string('postal_code', 20).notNullable();
      table.string('region', 50).nullable();
      table.string('country_code', 2).notNullable();
      table.timestamp('created_at');
      table.timestamp('updated_at');
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
