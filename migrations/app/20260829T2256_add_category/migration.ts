#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6cf42ca644ea1cb1a3a04fe837c4b420677b21661e8370457db8031dc963385c/contract';
import startContract from '../../snapshots/6cf42ca644ea1cb1a3a04fe837c4b420677b21661e8370457db8031dc963385c/contract.json' with { type: 'json' };
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
