import { BaseSchema } from '@adonisjs/lucid/schema';
import { Role } from '#types/enum/role';

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('role').notNullable().defaultTo(Role.CUSTOMER).alter();
    });
    this.defer((db) =>
      db.rawQuery('UPDATE users SET role = ? WHERE role = ?', [Role.CUSTOMER, 'user'])
    );
  }

  async down() {
    this.defer((db) =>
      db.rawQuery('UPDATE users SET role = ? WHERE role = ?', ['user', Role.CUSTOMER])
    );
    this.schema.alterTable('users', (table) => {
      table.string('role').notNullable().defaultTo('user').alter();
    });
  }
}
