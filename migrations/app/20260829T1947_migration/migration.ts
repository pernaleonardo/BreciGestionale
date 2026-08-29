#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/398af04c94537910772bedca1a463e5bd454c4797be2fb2d05f71484ad845cdf/contract';
import startContract from '../../snapshots/398af04c94537910772bedca1a463e5bd454c4797be2fb2d05f71484ad845cdf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6cf42ca644ea1cb1a3a04fe837c4b420677b21661e8370457db8031dc963385c/contract';
import endContract from '../../snapshots/6cf42ca644ea1cb1a3a04fe837c4b420677b21661e8370457db8031dc963385c/contract.json' with { type: 'json' };
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
