import { generateFixedSKU } from '#common/sku_generator';
import { BaseSchema } from '@adonisjs/lucid/schema';

type StockSkuRow = {
  id: number | string;
  sku: string;
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
        table.dropChecks(this.skuLengthCheckName);
      });

      await db.schema.alterTable(this.tableName, (table) => {
        table.string('sku', 20).notNullable().alter();
      });

      const stocks: StockSkuRow[] = await db
        .from(this.tableName)
        .select('id', 'sku', 'name', 'size')
        .orderBy('id');
      const generatedSkus = new Set<string>();

      for (const stock of stocks) {
        let sku: string | undefined;
        for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = generateFixedSKU(stock.name, 'NOCOLOR', stock.size ?? undefined);
          if (!generatedSkus.has(candidate)) {
            sku = candidate;
            break;
          }
        }
        if (!sku) {
          throw new Error(`Cannot generate a unique SKU for stock ${stock.id}`);
        }
        generatedSkus.add(sku);
        await db.from(this.tableName).where('id', stock.id).update({ sku });
      }

      await db.schema.alterTable(this.tableName, (table) => {
        table.unique('sku', this.skuUniqueName);
        table.check('CHAR_LENGTH(sku) <= 20', [], this.skuLengthCheckName);
      });
    });
  }

  async down() {
    this.defer(async (db) => {
      await db.schema.alterTable(this.tableName, (table) => {
        table.dropChecks(this.skuLengthCheckName);
        table.dropUnique(['sku'], this.skuUniqueName);
      });

      const stocks: StockSkuRow[] = await db
        .from(this.tableName)
        .select('id', 'sku', 'name', 'size');

      for (const stock of stocks) {
        if (Array.from(stock.sku).length === 10 && stock.sku.trim().length > 0) {
          continue;
        }

        let sku = Array.from(stock.sku.replaceAll('-', '')).slice(0, 10).join('');
        if (Array.from(sku).length < 10 || sku.trim().length === 0) {
          sku = generateFixedSKU(stock.name, 'NOCOLOR', stock.size ?? undefined)
            .replaceAll('-', '')
            .slice(0, 10);
        }
        await db.from(this.tableName).where('id', stock.id).update({ sku });
      }

      await db.schema.alterTable(this.tableName, (table) => {
        table.string('sku', 10).notNullable().alter();
        table.check('CHAR_LENGTH(sku) = 10', [], this.skuLengthCheckName);
      });
    });
  }
}
