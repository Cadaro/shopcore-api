import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'stocks';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('version').notNullable().defaultTo(1);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('version');
    });
  }
}
