import { BaseSchema } from '@adonisjs/lucid/schema';
import { generateFixedSKU } from '#common/sku_generator';

type StockSkuRow = {
  id: number | string;
  sku: string | null;
  name: string;
  size: string | null;
};

export default class extends BaseSchema {
  protected tableName = 'stocks';

  private get skuUniqueName() {
    return `${this.tableName}_sku_unique`;
  }

  private get skuLengthCheckName() {
    return `${this.tableName}_sku_length_check`;
  }

  async up() {
    this.defer(async (db) => {
      await db.schema.alterTable(this.tableName, (table) => {
        table.dropUnique(['sku'], this.skuUniqueName);
      });

      const stocks: Array<StockSkuRow> = await db
        .from(this.tableName)
        .select('id', 'sku', 'name', 'size');

      for (const stock of stocks) {
        const currentSku = stock.sku;
        const currentSkuLength = currentSku === null ? 0 : Array.from(currentSku).length;
        let sku = currentSku;

        if (currentSku === null || currentSku.trim().length === 0 || currentSkuLength < 10) {
          sku = generateFixedSKU(stock.name, 'NOCOLOR', stock.size ?? undefined);
        } else if (currentSkuLength > 10) {
          sku = Array.from(currentSku).slice(0, 10).join('');
        }

        if (sku !== currentSku) {
          await db.from(this.tableName).where('id', stock.id).update({ sku });
        }
      }

      await db.schema.alterTable(this.tableName, (table) => {
        table.string('sku', 10).notNullable().alter();
        table.check('CHAR_LENGTH(sku) = 10', [], this.skuLengthCheckName);
      });
    });
  }

  async down() {
    this.defer(async (db) => {
      const duplicateSkus = await db
        .from(this.tableName)
        .select('sku')
        .groupBy('sku')
        .havingRaw('COUNT(*) > 1');

      if (duplicateSkus.length > 0) {
        throw new Error(
          `Cannot roll back stock SKU migration: ${duplicateSkus.length} duplicate SKU values prevent restoring global uniqueness. Resolve the duplicates and rerun the rollback.`
        );
      }

      await db.schema.alterTable(this.tableName, (table) => {
        table.dropChecks(this.skuLengthCheckName);
      });

      await db.schema.alterTable(this.tableName, (table) => {
        table.string('sku').nullable().alter();
      });

      await db.schema.alterTable(this.tableName, (table) => {
        table.unique('sku', this.skuUniqueName);
      });
    });
  }
}
