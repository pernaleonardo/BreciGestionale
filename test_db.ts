import { db } from './src/prisma/db';

async function test() {
  try {
    const clients = await db.orm.public.Client.all();
    console.log('Clients count:', clients.length);
    
    const newClient = await db.orm.public.Client.create({
      name: 'TEST CLIENT',
      billingAddress: 'Via Test 1',
      clientCode: 'TC01',
      vatNumber: '12345678901'
    });
    console.log('Inserted:', newClient);
  } catch (e: any) {
    console.error('Error:', e);
  }
}

test();


