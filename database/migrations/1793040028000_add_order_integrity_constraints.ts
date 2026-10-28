import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const nullOrderIds = await db.from('orders').whereNull('order_id').count('* as count');
      const orphanedOrderUsers = await db
        .from('orders as orders')
        .leftJoin('users', 'users.uuid', 'orders.user_id')
        .whereNotNull('orders.user_id')
        .whereNull('users.id')
        .count('* as count');
      const orphanedStatusUpdates = await db
        .from('order_status_updates as updates')
        .leftJoin('orders', 'orders.order_id', 'updates.order_id')
        .whereNull('orders.id')
        .count('* as count');
      const orphanedInvoices = await db
        .from('order_invoices as invoices')
        .leftJoin('orders', 'orders.order_id', 'invoices.order_id')
        .whereNull('orders.id')
        .count('* as count');
      const orphanedOrderItems = await db
        .from('order_details as details')
        .leftJoin('stocks', 'stocks.item_id', 'details.item_id')
        .whereNull('stocks.id')
        .count('* as count');
      const duplicateOrderItems = await db
        .from('order_details')
        .select('order_id', 'item_id')
        .groupBy('order_id', 'item_id')
        .havingRaw('COUNT(*) > 1');
      const negativeStockQuantities = await db
        .from('stocks')
        .where('available_qty', '<', 0)
        .count('* as count');

      const count = (rows: Array<Record<string, string | number | bigint>>) =>
        Number(rows[0]?.count ?? 0);
      const violations: string[] = [];
      const addViolation = (violationCount: number, description: string) => {
        if (violationCount > 0) {
          violations.push(`${violationCount} ${description}`);
        }
      };
      addViolation(count(nullOrderIds), 'orders rows with a null order_id');
      addViolation(
        count(orphanedOrderUsers),
        'orders rows with a user_id that does not match users.uuid'
      );
      addViolation(
        count(orphanedStatusUpdates),
        'order_status_updates rows without a matching order'
      );
      addViolation(count(orphanedInvoices), 'order_invoices rows without a matching order');
      addViolation(count(orphanedOrderItems), 'order_details rows without a matching stock item');
      addViolation(duplicateOrderItems.length, 'duplicate order_details order_id/item_id pairs');
      addViolation(count(negativeStockQuantities), 'stocks rows with a negative available_qty');

      if (violations.length > 0) {
        const details = violations.join('; ');
        throw new Error(
          `Cannot add order integrity constraints: ${details}. Correct these rows and rerun the migration; no rows were changed.`
        );
      }

      await db.schema.alterTable('orders', (table) => {
        table.string('order_id', 255).notNullable().alter();
        table.string('user_id', 255).nullable().alter();
        table
          .foreign('user_id', 'orders_user_id_users_uuid_fk')
          .references('uuid')
          .inTable('users')
          .onDelete('SET NULL');
      });

      await db.schema.alterTable('order_status_updates', (table) => {
        table.index(['order_id', 'created_at'], 'order_status_order_created_idx');
        table
          .foreign('order_id', 'order_status_updates_order_id_fk')
          .references('order_id')
          .inTable('orders')
          .onDelete('CASCADE');
      });

      await db.schema.alterTable('order_invoices', (table) => {
        table.index('order_id', 'order_invoices_order_id_idx');
        table
          .foreign('order_id', 'order_invoices_order_id_fk')
          .references('order_id')
          .inTable('orders')
          .onDelete('RESTRICT');
      });

      await db.schema.alterTable('order_details', (table) => {
        table.unique(['order_id', 'item_id'], 'order_details_order_item_unique');
        table.index('item_id', 'order_details_item_id_idx');
        table
          .foreign('item_id', 'order_details_item_id_fk')
          .references('item_id')
          .inTable('stocks')
          .onDelete('RESTRICT');
      });

      await db.schema.alterTable('invoice_customers', (table) => {
        table.index('user_id', 'invoice_customers_user_id_idx');
      });

      await db.schema.alterTable('stocks', (table) => {
        table.check(
          'available_qty IS NULL OR available_qty >= 0',
          [],
          'stocks_available_qty_nonnegative_check'
        );
      });
    });
  }

  async down() {
    this.defer(async (db) => {
      const nullOrderUsers = await db.from('orders').whereNull('user_id').count('* as count');
      const nullOrderUserCount = Number(nullOrderUsers[0]?.count ?? 0);
      if (nullOrderUserCount > 0) {
        throw new Error(
          `Cannot restore orders.user_id to NOT NULL: ${nullOrderUserCount} orders have no associated user. Reassign them before rerunning the rollback.`
        );
      }

      await db.schema.alterTable('stocks', (table) => {
        table.dropChecks('stocks_available_qty_nonnegative_check');
      });

      await db.schema.alterTable('invoice_customers', (table) => {
        table.dropIndex('user_id', 'invoice_customers_user_id_idx');
      });

      await db.schema.alterTable('order_details', (table) => {
        table.dropForeign('item_id', 'order_details_item_id_fk');
        table.dropIndex('item_id', 'order_details_item_id_idx');
        table.index('order_id', 'order_details_order_id_idx');
        table.dropUnique(['order_id', 'item_id'], 'order_details_order_item_unique');
      });

      await db.schema.alterTable('order_invoices', (table) => {
        table.dropForeign('order_id', 'order_invoices_order_id_fk');
        table.dropIndex('order_id', 'order_invoices_order_id_idx');
      });

      await db.schema.alterTable('order_status_updates', (table) => {
        table.dropForeign('order_id', 'order_status_updates_order_id_fk');
        table.dropIndex(['order_id', 'created_at'], 'order_status_order_created_idx');
      });

      await db.schema.alterTable('orders', (table) => {
        table.dropForeign('user_id', 'orders_user_id_users_uuid_fk');
      });

      await db.schema.alterTable('orders', (table) => {
        table.string('user_id', 255).notNullable().alter();
        table.string('order_id', 255).nullable().alter();
      });
    });
  }
}
