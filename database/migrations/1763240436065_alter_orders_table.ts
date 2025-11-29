import { Currency } from '#types/enum/currencyCode';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import { OrderStatus } from '#types/enum/orderStatus';
import { PaymentMethod } from '#types/enum/paymentMethod';
import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'orders';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status', 20).comment('current order status');
      table.string('first_name', 50).nullable().comment('customer first name used for delivery');
      table.string('last_name', 50).nullable().comment('customer last name used for delivery');
      table
        .string('company_name', 100)
        .nullable()
        .comment('customer company name used for delivery');
      table.string('email', 100).comment('customer email address used for delivery');
      table.string('phone_number', 20).comment('customer phone number used for delivery');
      table.string('courier', 50).comment('courier name used for delivery');
      table.string('delivery_method', 20).comment('delivery method');
      table
        .string('pickup_point_id', 255)
        .nullable()
        .comment('Pickup point identifier if delivery method is pickup point');
      table.string('additional_note', 255).nullable().comment('Additional note for the delivery');
      table.decimal('delivery_price', 10, 2).comment('Price for the delivery');
      table.string('delivery_currency', 3).comment('Currency code for the delivery price');
      table.decimal('delivery_vat_rate', 5, 2).comment('VAT rate for the delivery');
      table.string('payment_method', 50).comment('Payment method for the order');
      table.string('order_id', 255).alter();
      table.dropForeign('user_id');
      table.string('user_uuid', 255).comment('Reference to the user unique identifier');
    });
    this.defer(async (db) => {
      // Map integer user IDs to UUIDs
      const users = await db.from('users').select('uuid', 'id');
      const userIdMap: Record<number, string> = {};
      users.forEach((user) => {
        userIdMap[user.id] = user.uuid;
      });
      // Update orders with corresponding user UUIDs
      const ordersToUpdate = await db.from(this.tableName).select('user_id');
      await Promise.all(
        ordersToUpdate.map((order) => {
          return db
            .from(this.tableName)
            .where('user_id', order.user_id)
            .update({ user_uuid: userIdMap[order.user_id] });
        })
      );
      // Set default values for new columns where necessary
      const orders = await db
        .from(this.tableName)
        .select('id')
        .whereNull('status')
        .whereNull('email')
        .whereNull('phone_number')
        .whereNull('courier')
        .whereNull('delivery_method')
        .whereNull('delivery_price')
        .whereNull('delivery_currency')
        .whereNull('delivery_vat_rate')
        .whereNull('payment_method');
      await Promise.all(
        orders.map((order) => {
          return db.from(this.tableName).where('id', order.id).update({
            status: OrderStatus.NEW,
            email: '',
            phone_number: '',
            courier: '',
            method: DeliveryMethod.PICKUP_POINT,
            delivery_price: 0,
            delivery_currency: Currency.EUR,
            payment_method: PaymentMethod.BANK_TRANSFER,
          });
        })
      );
      await db.schema.alterTable(this.tableName, (table) => {
        table.string('status').notNullable().alter();
        table.string('email').notNullable().alter();
        table.string('phone_number').notNullable().alter();
        table.string('courier').notNullable().alter();
        table.string('delivery_method').notNullable().alter();
        table.decimal('delivery_price', 10, 2).notNullable().alter();
        table.string('delivery_currency', 3).notNullable().alter();
        table.decimal('delivery_vat_rate', 5, 2).notNullable().alter();
        table.string('payment_method').notNullable().alter();
        table.dropColumn('user_id');
        table.renameColumn('user_uuid', 'user_id');
        table.string('user_id').notNullable().index().alter();
      });
    });
  }

  async down() {
    this.defer(async (db) => {
      // Add temporary bigint user_id column
      await db.schema.alterTable(this.tableName, (table) => {
        table.bigInteger('user_id_temp').unsigned();
      });

      // Map UUIDs back to integer IDs
      const users = await db.from('users').select('uuid', 'id');
      const userUuidMap: Record<string, number> = {};
      users.forEach((user) => {
        userUuidMap[user.uuid] = user.id;
      });

      const ordersToUpdate = await db.from(this.tableName).select('user_id');
      await Promise.all(
        ordersToUpdate.map((order) => {
          return db
            .from(this.tableName)
            .where('user_id', order.user_id)
            .update({ user_id_temp: userUuidMap[order.user_id] });
        })
      );

      // Drop old user_id (which is actually user_uuid) and rename temp column
      await db.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('user_id');
      });

      await db.schema.alterTable(this.tableName, (table) => {
        table.renameColumn('user_id_temp', 'user_id');
      });

      // Set NOT NULL and add foreign key
      await db.schema.alterTable(this.tableName, (table) => {
        table.bigInteger('user_id').unsigned().notNullable().alter();
        table.foreign('user_id').references('id').inTable('users');
      });

      // Drop all other columns and reset order_id
      await db.schema.alterTable(this.tableName, (table) => {
        table.dropColumns(
          'status',
          'first_name',
          'last_name',
          'company_name',
          'email',
          'phone_number',
          'courier',
          'delivery_method',
          'pickup_point_id',
          'additional_note',
          'delivery_price',
          'delivery_currency',
          'payment_method',
          'delivery_vat_rate'
        );
        table.string('order_id').alter();
      });
    });
  }
}
