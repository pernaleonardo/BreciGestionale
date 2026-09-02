import { getTripsData } from './src/app/actions';
async function test() {
  const data = await getTripsData();
  console.log('Clients count:', data.clients?.length);
  console.log('Trips count:', data.trips?.length);
}
test();
