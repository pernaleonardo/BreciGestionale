import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

// Singleton per evitare connessioni multiple durante l'hot-reloading in Next.js dev
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof postgres<Contract>> | undefined;
};

const getDb = (): ReturnType<typeof postgres<Contract>> => {
  if (!globalForDb.db) {
    globalForDb.db = postgres<Contract>({
      contractJson,
      url: process.env['DATABASE_URL']!,
    });
  }
  return globalForDb.db;
};

// Utilizziamo un Proxy per ritardare la creazione del client Prisma Next
// fino al primo utilizzo effettivo (es. a runtime/request time),
// assicurando che Next.js abbia già caricato le variabili d'ambiente (.env).
export const db = new Proxy({} as ReturnType<typeof postgres<Contract>>, {
  get(target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

