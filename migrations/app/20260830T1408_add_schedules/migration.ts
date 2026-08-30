#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0afb6b39d87df17dbc84a223238104be464009fd6df9e5f65944cff945107ae6/contract';
import endContract from '../../snapshots/0afb6b39d87df17dbc84a223238104be464009fd6df9e5f65944cff945107ae6/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/84dc69f56d65da05c89458680b6780499e030ec9de2ff94414bc569bedd6188a/contract';
import startContract from '../../snapshots/84dc69f56d65da05c89458680b6780499e030ec9de2ff94414bc569bedd6188a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'schedule',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('date', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('driverId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('endDate', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startDate', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('vehicleId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'schedule',
        index: 'schedule_driverId_idx_8eed3317',
        columns: ['driverId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'schedule',
        index: 'schedule_vehicleId_idx_e2df58fc',
        columns: ['vehicleId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'schedule',
        foreignKey: {
          name: 'schedule_driverId_fkey',
          columns: ['driverId'],
          references: { schema: 'public', table: 'driver', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'schedule',
        foreignKey: {
          name: 'schedule_vehicleId_fkey',
          columns: ['vehicleId'],
          references: { schema: 'public', table: 'vehicle', columns: ['id'] },
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'schedule' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
