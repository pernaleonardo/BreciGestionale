#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/398af04c94537910772bedca1a463e5bd454c4797be2fb2d05f71484ad845cdf/contract';
import startContract from '../../snapshots/398af04c94537910772bedca1a463e5bd454c4797be2fb2d05f71484ad845cdf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/7419a6d2b13749927e17997a6f1f3033762c7cd839541ae1b02b7597fd10a1ad/contract';
import endContract from '../../snapshots/7419a6d2b13749927e17997a6f1f3033762c7cd839541ae1b02b7597fd10a1ad/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
