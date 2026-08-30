#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/67cabadf70f854179e5e3dff47a3a7e3544e7f191e0200a8cd1ef6fb3b7b75cd/contract';
import startContract from '../../snapshots/67cabadf70f854179e5e3dff47a3a7e3544e7f191e0200a8cd1ef6fb3b7b75cd/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/84dc69f56d65da05c89458680b6780499e030ec9de2ff94414bc569bedd6188a/contract';
import endContract from '../../snapshots/84dc69f56d65da05c89458680b6780499e030ec9de2ff94414bc569bedd6188a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'disposalPrice',
        columns: [
          col('clientId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('pricePerQuintal', 'float8', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/float8@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('wasteTypeId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'transportPrice',
        columns: [
          col('clientId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('price', 'float8', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/float8@1' },
          }),
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
        table: 'disposalPrice',
        index: 'disposalPrice_clientId_idx_153a9a49',
        columns: ['clientId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'disposalPrice',
        index: 'disposalPrice_wasteTypeId_idx_26e4c367',
        columns: ['wasteTypeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'transportPrice',
        index: 'transportPrice_clientId_idx_153a9a49',
        columns: ['clientId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'transportPrice',
        index: 'transportPrice_vehicleId_idx_e2df58fc',
        columns: ['vehicleId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'disposalPrice',
        foreignKey: {
          name: 'disposalPrice_clientId_fkey',
          columns: ['clientId'],
          references: { schema: 'public', table: 'client', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'disposalPrice',
        foreignKey: {
          name: 'disposalPrice_wasteTypeId_fkey',
          columns: ['wasteTypeId'],
          references: { schema: 'public', table: 'wasteType', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'transportPrice',
        foreignKey: {
          name: 'transportPrice_clientId_fkey',
          columns: ['clientId'],
          references: { schema: 'public', table: 'client', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'transportPrice',
        foreignKey: {
          name: 'transportPrice_vehicleId_fkey',
          columns: ['vehicleId'],
          references: { schema: 'public', table: 'vehicle', columns: ['id'] },
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'disposalPrice' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'transportPrice' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
