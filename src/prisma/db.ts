import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

// Singleton per evitare connessioni multiple durante l'hot-reloading in Next.js dev
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof postgres<Contract>> | undefined;
};

const getDb = (): ReturnType<typeof postgres<Contract>> => {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    // Se DATABASE_URL non è ancora disponibile (es. durante la compilazione statica di Next.js),
    // non salviamo il client nel singleton globale così da poterlo reinizializzare al primo utilizzo a runtime.
    return postgres<Contract>({
      contractJson,
      url: '',
    });
  }

  if (!globalForDb.db) {
    globalForDb.db = postgres<Contract>({
      contractJson,
      url,
    });
  }
  return globalForDb.db;
};

// Utilizziamo un Proxy per ritardare la creazione del client Prisma Next
// fino al primo utilizzo effettivo (es. a runtime/request time),
// assicurando che Next.js abbia già caricato le variabili d'ambiente (.env).
export const db = new Proxy({} as ReturnType<typeof postgres<Contract>>, {
  get(target, prop, receiver) {
    // Evita l'inizializzazione del client per ispezioni del compilatore/sistema (es. HMR, SSR)
    if (
      typeof prop === 'symbol' ||
      prop === 'then' ||
      prop === '$$typeof' ||
      prop === 'constructor' ||
      prop === 'prototype' ||
      prop === 'toJSON'
    ) {
      return Reflect.get(target, prop, receiver);
    }
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

