import { BaseSchema } from '@adonisjs/lucid/schema';
import type { QueryClientContract } from '@adonisjs/lucid/types/database';

const columns = [
  { table: 'stocks', column: 'price', oldType: 'FLOAT(8,2) NOT NULL', limit: 99999999 },
  {
    table: 'stocks',
    column: 'vat_amount',
    oldType: 'FLOAT(8,2) NOT NULL DEFAULT 0',
    limit: 99999999,
    defaultValue: ' DEFAULT 0',
  },
  { table: 'order_details', column: 'item_price', oldType: 'FLOAT(8,2) NOT NULL', limit: 99999999 },
  { table: 'order_details', column: 'vat_amount', oldType: 'FLOAT(8,2) NOT NULL', limit: 99999999 },
  {
    table: 'order_invoice_details',
    column: 'price_gross',
    oldType: 'FLOAT(8,2) NOT NULL',
    limit: 99999999,
  },
  {
    table: 'order_invoice_details',
    column: 'vat_amount',
    oldType: 'FLOAT(8,2) NOT NULL',
    limit: 99999999,
  },
  {
    table: 'orders',
    column: 'delivery_price',
    oldType: 'DECIMAL(10,2) NOT NULL',
    limit: 9999999999,
  },
];

export default class extends BaseSchema {
  static disableTransactions = true;

  protected get moneyColumns(): typeof columns {
    return columns;
  }

  private async convert(db: QueryClientContract, direction: 'up' | 'down') {
    const metadata = async (table: string, column: string) =>
      db
        .from('information_schema.columns')
        .select('data_type as dataType', 'numeric_scale as numericScale')
        .whereRaw('table_schema = DATABASE()')
        .where('table_name', table)
        .where('column_name', column)
        .first();

    // MySQL DDL commits implicitly. Validate every column before changing any of them.
    for (const entry of this.moneyColumns) {
      const current = await metadata(entry.table, entry.column);
      if (!current) throw new Error(`Missing monetary column ${entry.table}.${entry.column}`);
      const isMinor = current.dataType === 'decimal' && Number(current.numericScale) === 0;
      if ((direction === 'up' && isMinor) || (direction === 'down' && !isMinor)) continue;
      const limit = direction === 'up' ? 999999999999.99 : entry.limit;
      const invalid = await db
        .from(entry.table)
        .whereRaw('ABS(??) > ?', [entry.column, limit])
        .count('* as count')
        .first();
      if (Number(invalid?.count) > 0) {
        throw new Error(
          `Cannot migrate ${entry.table}.${entry.column}: values exceed the ${direction} conversion range`
        );
      }
    }

    for (const entry of this.moneyColumns) {
      const current = await metadata(entry.table, entry.column);
      const isMinor = current.dataType === 'decimal' && Number(current.numericScale) === 0;
      if ((direction === 'up' && isMinor) || (direction === 'down' && !isMinor)) continue;
      const temporary = `money_tmp_${entry.column}`;
      const tempType = direction === 'up' ? 'DECIMAL(14,0)' : entry.oldType.split(' NOT NULL')[0];
      const existingTemporary = await metadata(entry.table, temporary);
      if (existingTemporary) {
        const temporaryIsMinor =
          existingTemporary.dataType === 'decimal' && Number(existingTemporary.numericScale) === 0;
        if (temporaryIsMinor !== (direction === 'up')) {
          throw new Error(`Unexpected temporary column ${entry.table}.${temporary}`);
        }
      } else {
        await db.rawQuery(`ALTER TABLE ?? ADD COLUMN ?? ${tempType} NULL`, [
          entry.table,
          temporary,
        ]);
      }
      const expression = direction === 'up' ? 'CAST(?? AS DECIMAL(16,2)) * 100' : '?? / 100';
      await db.rawQuery(`UPDATE ?? SET ?? = ${expression}`, [entry.table, temporary, entry.column]);
      const targetType =
        direction === 'up' ? `DECIMAL(14,0) NOT NULL${entry.defaultValue ?? ''}` : entry.oldType;
      await db.rawQuery(`ALTER TABLE ?? DROP COLUMN ??, CHANGE COLUMN ?? ?? ${targetType}`, [
        entry.table,
        entry.column,
        temporary,
        entry.column,
      ]);
    }
  }

  async up() {
    this.defer((db) => this.convert(db, 'up'));
  }

  async down() {
    this.defer((db) => this.convert(db, 'down'));
  }
}
