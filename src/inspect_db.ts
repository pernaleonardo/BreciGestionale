import { db } from './prisma/db';

async function run() {
  try {
    const schedules = await db.orm.public.Schedule.include('driver').include('vehicle').all();
    console.log('--- SCHEDULES IN DATABASE ---');
    if (schedules.length === 0) {
      console.log('No schedules found in the database.');
    } else {
      schedules.forEach((s: any) => {
        console.log(`ID: ${s.id} | Date: ${s.date} | Start: ${s.startDate} | Driver: ${s.driver?.name} (ID: ${s.driverId}) | Vehicle: ${s.vehicle?.plateNumber} | Status: ${s.status}`);
      });
    }
    console.log('-----------------------------');
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
