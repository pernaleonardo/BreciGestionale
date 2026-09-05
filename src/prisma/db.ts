import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Diagnostica e caricamento env
const loadEnv = () => {
  const cwd = process.cwd();
  console.log('[Prisma Debug] process.cwd() is:', cwd);

  const pathsToTry = [
    path.resolve(cwd, '.env'),
    path.resolve(cwd, 'gestionale-web/.env'),
    path.resolve(cwd, '../.env'),
  ];

  let loaded = false;
  for (const envPath of pathsToTry) {
    if (fs.existsSync(/*turbopackIgnore: true*/ envPath)) {
      const result = dotenv.config({ path: envPath });
      if (result.error) {
        console.error(`[Prisma Debug] Failed to load env from ${envPath}:`, result.error);
      } else {
        console.log(`[Prisma Debug] Successfully loaded env from ${envPath}`);
        loaded = true;
        break;
      }
    } else {
      console.log(`[Prisma Debug] Env file does not exist at: ${envPath}`);
    }
  }

  if (!loaded && !process.env['DATABASE_URL']) {
    console.warn('[Prisma Debug] Could not find or load any .env file and DATABASE_URL is not set.');
  }
};

loadEnv();
console.log('[Prisma Debug] DATABASE_URL env is:', process.env['DATABASE_URL'] ? 'SET' : 'NOT SET');

// Singleton per evitare connessioni multiple durante l'hot-reloading in Next.js dev
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof postgres<Contract>> | undefined;
};

const getDb = (): ReturnType<typeof postgres<Contract>> => {
  let url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not defined. Please verify that your .env file is present and configured correctly."
    );
  }

  // Supabase Pooler: la porta 5432 (Session Mode) ha un limite rigido di 15 connessioni simultanee (EMAXCONNSESSION).
  // Su ambienti serverless (es. Vercel), convertiamo automaticamente alla porta 6543 (Transaction Mode) per supportare carichi concorrenti.
  if (url.includes('pooler.supabase.com:5432')) {
    url = url.replace(':5432', ':6543');
  }

  if (!globalForDb.db) {
    globalForDb.db = postgres<Contract>({
      contractJson,
      url,
      verifyMarker: false,
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
