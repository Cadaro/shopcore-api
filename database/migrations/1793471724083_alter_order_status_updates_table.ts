import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected oldTableName = 'order_status_updates';
  protected newTableName = 'order_histories';

  async up() {
    this.schema.renameTable(this.oldTableName, this.newTableName);
    this.schema.alterTable(this.newTableName, (table) => {
      table.timestamp('status_datetime', { useTz: true }).defaultTo(this.now());
      table.boolean('is_visible_to_customer').defaultTo(true);
      table.dropIndex(['order_id', 'created_at'], 'order_status_order_created_idx');
      table.dropForeign('order_id', 'order_status_updates_order_id_fk');
      table
        .foreign('order_id', 'order_histories_order_id_fk')
        .references('order_id')
        .inTable('orders')
        .onDelete('CASCADE');
      table.index(
        ['order_id', 'is_visible_to_customer', 'status_datetime'],
        'order_histories_order_status_idx'
      );
    });
  }

  async down() {
    this.schema.renameTable(this.newTableName, this.oldTableName);
    this.schema.alterTable(this.oldTableName, (table) => {
      table.dropColumn('status_datetime');
      table.dropIndex(
        ['order_id', 'is_visible_to_customer', 'status_datetime'],
        'order_histories_order_status_idx'
      );
      table.dropForeign('order_id', 'order_histories_order_id_fk');
      table
        .foreign('order_id', 'order_status_updates_order_id_fk')
        .references('order_id')
        .inTable('orders')
        .onDelete('CASCADE');
      table.index(['order_id', 'created_at'], 'order_status_order_created_idx');
      table.dropColumn('is_visible_to_customer');
    });
  }
}
