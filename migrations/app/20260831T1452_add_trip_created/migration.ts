#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/67cb877df0894e9e05390cc26c40a3a7e7916594086b98c310dd4bb00ee1669d/contract';
import endContract from '../../snapshots/67cb877df0894e9e05390cc26c40a3a7e7916594086b98c310dd4bb00ee1669d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fc51112c9f7da7c854aa2131a2dd63b83cf52bb22d174f323896ed9fbcbf16e6/contract';
import startContract from '../../snapshots/fc51112c9f7da7c854aa2131a2dd63b83cf52bb22d174f323896ed9fbcbf16e6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'schedule',
        column: col('tripCreated', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
