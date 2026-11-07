import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'rate_limits';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .string('key', 255)
        .notNullable()
        .primary()
        .comment('Unique key identifying a rate limit bucket');
      table
        .integer('points', 9)
        .notNullable()
        .defaultTo(0)
        .comment('Number of requests consumed in the current window');
      table
        .bigint('expire')
        .unsigned()
        .comment('Unix timestamp when the rate limit bucket expires');
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
