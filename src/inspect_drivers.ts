import { db } from './prisma/db.ts';

async function run() {
  try {
    const drivers = await db.orm.public.Driver.all();
    console.log('--- DRIVERS IN DATABASE ---');
    drivers.forEach((d: any) => {
      console.log(`ID: ${d.id} | Name: ${d.name} | Email: ${d.email}`);
    });
    console.log('---------------------------');
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
