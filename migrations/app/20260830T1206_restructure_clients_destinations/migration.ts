#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/67cabadf70f854179e5e3dff47a3a7e3544e7f191e0200a8cd1ef6fb3b7b75cd/contract';
import endContract from '../../snapshots/67cabadf70f854179e5e3dff47a3a7e3544e7f191e0200a8cd1ef6fb3b7b75cd/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7419a6d2b13749927e17997a6f1f3033762c7cd839541ae1b02b7597fd10a1ad/contract';
import startContract from '../../snapshots/7419a6d2b13749927e17997a6f1f3033762c7cd839541ae1b02b7597fd10a1ad/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  placeholder,
  primaryKey,
  rawSql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'trip',
        constraint: 'trip_producerId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'trip',
        constraint: 'trip_recipientId_fkey',
        kind: 'foreignKey',
      }),
      this.dropTable({ schema: 'public', table: 'company' }),
      this.dropIndex({ schema: 'public', table: 'trip', index: 'trip_producerId_idx_a32fa932' }),
      this.dropColumn({ schema: 'public', table: 'trip', column: 'producerId' }),
      this.dropIndex({ schema: 'public', table: 'trip', index: 'trip_recipientId_idx_c9527cf8' }),
      this.dropColumn({ schema: 'public', table: 'trip', column: 'recipientId' }),
      this.createTable({
        schema: 'public',
        table: 'client',
        columns: [
          col('billingAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('clientCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('vatNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'destination',
        columns: [
          col('address', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('clientId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('shippingCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'trip',
        column: col('destinationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      rawSql({
        id: 'backfill-trip-destinationId',
        operationClass: 'data',
        label: 'backfill-trip-destinationId',
        summary: 'Delete existing trips to satisfy destinationId null constraint',
        target: { id: 'postgres' },
        precheck: [],
        execute: [{
          description: 'delete existing trips',
          sql: 'DELETE FROM "trip";'
        }],
        postcheck: []
      }),
      this.setNotNull({ schema: 'public', table: 'trip', column: 'destinationId' }),
      this.addUnique({
        schema: 'public',
        table: 'client',
        constraint: 'client_vatNumber_key',
        columns: ['vatNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'client',
        constraint: 'client_clientCode_key',
        columns: ['clientCode'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'destination',
        constraint: 'destination_shippingCode_key',
        columns: ['shippingCode'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'destination',
        index: 'destination_clientId_idx_153a9a49',
        columns: ['clientId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trip',
        index: 'trip_destinationId_idx_1646ee5c',
        columns: ['destinationId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'destination',
        foreignKey: {
          name: 'destination_clientId_fkey',
          columns: ['clientId'],
          references: { schema: 'public', table: 'client', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'trip',
        foreignKey: {
          name: 'trip_destinationId_fkey',
          columns: ['destinationId'],
          references: { schema: 'public', table: 'destination', columns: ['id'] },
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'client' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'destination' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
