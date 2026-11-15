import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'stocks';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_visible').notNullable().defaultTo(true);
      table.string('color', 30).notNullable().defaultTo('NOCOLOR');
    });

    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_visible').notNullable().defaultTo(false).alter();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_visible');
      table.dropColumn('color');
    });
  }
}
