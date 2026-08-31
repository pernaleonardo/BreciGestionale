#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0afb6b39d87df17dbc84a223238104be464009fd6df9e5f65944cff945107ae6/contract';
import startContract from '../../snapshots/0afb6b39d87df17dbc84a223238104be464009fd6df9e5f65944cff945107ae6/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fc51112c9f7da7c854aa2131a2dd63b83cf52bb22d174f323896ed9fbcbf16e6/contract';
import endContract from '../../snapshots/fc51112c9f7da7c854aa2131a2dd63b83cf52bb22d174f323896ed9fbcbf16e6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('analisiPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('bigBagPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('cerPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('destinationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('disposalPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('firNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('fuoriRomaPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('loadedQuantity', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('noleggioPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('servRagnoPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('sostaPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('status', 'text', {
          notNull: true,
          default: lit('PIANIFICATO'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('transportPrice', 'float8', {
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('wasteTypeId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'schedule',
        index: 'schedule_destinationId_idx_1646ee5c',
        columns: ['destinationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'schedule',
        index: 'schedule_wasteTypeId_idx_26e4c367',
        columns: ['wasteTypeId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'schedule',
        foreignKey: {
          name: 'schedule_destinationId_fkey',
          columns: ['destinationId'],
          references: { schema: 'public', table: 'destination', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'schedule',
        foreignKey: {
          name: 'schedule_wasteTypeId_fkey',
          columns: ['wasteTypeId'],
          references: { schema: 'public', table: 'wasteType', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
