import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set!');
    return;
  }

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to Supabase database.');

    // Add status and loadedQuantity columns to the schedule table if they don't exist
    await client.query("ALTER TABLE public.\"schedule\" ADD COLUMN IF NOT EXISTS \"status\" text NOT NULL DEFAULT 'PIANIFICATO';");
    console.log('Column "status" created/checked successfully.');

    await client.query('ALTER TABLE public."schedule" ADD COLUMN IF NOT EXISTS "loadedQuantity" double precision;');
    console.log('Column "loadedQuantity" created/checked successfully.');

  } catch (e) {
    console.error('Error executing database migration query:', e);
  } finally {
    await client.end();
  }
}

run();
