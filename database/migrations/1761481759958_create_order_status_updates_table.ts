import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'order_status_updates';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.index(['order_id', 'status', 'created_at'], 'order_status_idx');
      table.bigIncrements('id').unsigned().notNullable().primary();
      table.string('order_id', 255).notNullable().comment('order unique identifier');
      table.string('status', 20).notNullable().comment('order status');
      table.timestamp('created_at');
      table.timestamp('updated_at');
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
