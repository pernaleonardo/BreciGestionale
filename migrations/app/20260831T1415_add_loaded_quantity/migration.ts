#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/398af04c94537910772bedca1a463e5bd454c4797be2fb2d05f71484ad845cdf/contract';
import startContract from '../../snapshots/398af04c94537910772bedca1a463e5bd454c4797be2fb2d05f71484ad845cdf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a01b52986e6a6f016fc29696354027060145751d0613a32fd82a85097de9d668/contract';
import endContract from '../../snapshots/a01b52986e6a6f016fc29696354027060145751d0613a32fd82a85097de9d668/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  placeholder,
  primaryKey,
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
          col('loadedQuantity', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startDate', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PIANIFICATO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('vehicleId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('password', 'text', {
          notNull: true,
          default: lit('operator'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'wasteType',
        column: col('category', 'text', {
          notNull: true,
          default: lit('Altro'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'trip',
        column: col('destinationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-trip-destinationId', {
        check: () => placeholder('backfill-trip-destinationId:check'),
        run: () => placeholder('backfill-trip-destinationId:run'),
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
      this.enableRowLevelSecurity({ schema: 'public', table: 'disposalPrice' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'schedule' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'transportPrice' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
