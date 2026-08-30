// @ts-ignore
import { db } from './db.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Cleaning up database...');
  await db.orm.public.GPSLog.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Trip.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Destination.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.DisposalPrice.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.TransportPrice.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Client.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Driver.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Vehicle.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.WasteType.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.User.where((f) => f.id.gt(0)).deleteAll();

  // Load and seed CER codes
  const cerCodesPath = path.join(__dirname, 'cer_codes.json');
  const cerCodesData = JSON.parse(fs.readFileSync(cerCodesPath, 'utf8'));
  console.log(`Seeding ${cerCodesData.length} CER codes (spaces removed)...`);
  
  const wasteMap = new Map<string, any>();
  for (const item of cerCodesData) {
    const created = await db.orm.public.WasteType.create({
      cerCode: item.cerCode,
      description: item.description,
      category: item.category,
    });
    wasteMap.set(item.cerCode, created);
  }

  // Create users
  console.log('Creating default users...');
  await db.orm.public.User.create({
    email: 'admin@brecitrasporti.it',
    password: 'admin',
    name: 'Amministratore',
    role: 'ADMIN',
  });

  await db.orm.public.User.create({
    email: 'operator@brecitrasporti.it',
    password: 'operator',
    name: 'Operatore',
    role: 'OPERATOR',
  });

  // Create clients
  console.log('Creating clients...');
  const pmGroup = await db.orm.public.Client.create({
    name: 'P&M GROUP SRL',
    billingAddress: "VIA DELL'AMBA ARADAM 22 Roma 00184 RM",
    vatNumber: '15517251003',
    clientCode: 'PM-001',
  });

  const rime1 = await db.orm.public.Client.create({
    name: 'RIME 1 SRL',
    billingAddress: 'VIA DI MAGLIANA, 1098 Roma 00148 RM',
    vatNumber: '04764321008',
    clientCode: 'RIME-001',
  });

  const breciTrasporti = await db.orm.public.Client.create({
    name: 'BRECI TRASPORTI SRL',
    billingAddress: 'Via dei Trasporti, 45 Roma',
    vatNumber: '13656521005',
    clientCode: 'BRECI-001',
  });

  // Create destinations for clients
  console.log('Creating destinations...');
  const destViaDeiMille = await db.orm.public.Destination.create({
    name: 'VIA DEI MILLE',
    address: 'VIA DEI MILLE, Roma',
    shippingCode: 'MILLE-01',
    clientId: pmGroup.id,
  });

  const destViaDeiGiubb = await db.orm.public.Destination.create({
    name: 'VIA DEI GIUBBONARI',
    address: 'VIA DEI GIUBBONARI, Roma',
    shippingCode: 'GIUBB-01',
    clientId: pmGroup.id,
  });

  // Create drivers
  console.log('Creating drivers...');
  const driverLeonardo = await db.orm.public.Driver.create({
    name: 'Leonardo Perna',
    email: 'perna.leonardo@gmail.com',
    phone: '+39 333 1234567',
    licenseNumber: 'U1C234567K',
    status: 'AVAILABLE',
  });

  // Create vehicles
  console.log('Creating vehicles...');
  const vehicle1 = await db.orm.public.Vehicle.create({
    plateNumber: 'HD014KY',
    model: 'Iveco Stralis',
    capacity: 26000,
    status: 'ACTIVE',
  });

  const vehicle2 = await db.orm.public.Vehicle.create({
    plateNumber: 'GK273YM',
    model: 'Scania R500',
    capacity: 28000,
    status: 'ACTIVE',
  });

  const vehicle3 = await db.orm.public.Vehicle.create({
    plateNumber: 'GR373VD',
    model: 'Volvo FH16',
    capacity: 30000,
    status: 'ACTIVE',
  });

  const vehicle4 = await db.orm.public.Vehicle.create({
    plateNumber: 'HE921ZX',
    model: 'Mercedes Actros',
    capacity: 25000,
    status: 'ACTIVE',
  });

  // Create Price Lists (Disposal & Transport)
  console.log('Creating price lists...');
  
  // Base disposal prices:
  // 170107: €1.70 per quintal (€17.00 per ton)
  const disposalBase170107 = await db.orm.public.DisposalPrice.create({
    wasteTypeId: wasteMap.get('170107')?.id,
    pricePerQuintal: 1.70,
  });

  // 170904: €2.00 per quintal (€20.00 per ton)
  const disposalBase170904 = await db.orm.public.DisposalPrice.create({
    wasteTypeId: wasteMap.get('170904')?.id,
    pricePerQuintal: 2.00,
  });

  // Client-specific override: Client RIME-001 gets 170107 at €1.50/quintal
  const disposalOverride170107 = await db.orm.public.DisposalPrice.create({
    clientId: rime1.id,
    wasteTypeId: wasteMap.get('170107')?.id,
    pricePerQuintal: 1.50,
  });

  // Transport rates (based on vehicle used):
  // Vehicle1 (HD014KY): €220.00
  const transportPriceVehicle1 = await db.orm.public.TransportPrice.create({
    vehicleId: vehicle1.id,
    price: 220.00,
  });

  // Vehicle2 (GK273YM): €130.00
  const transportPriceVehicle2 = await db.orm.public.TransportPrice.create({
    vehicleId: vehicle2.id,
    price: 130.00,
  });

  // Vehicle3 (GR373VD): €250.00
  const transportPriceVehicle3 = await db.orm.public.TransportPrice.create({
    vehicleId: vehicle3.id,
    price: 250.00,
  });

  // Create trips (from user's Excel sheet)
  console.log('Creating trips...');
  await db.orm.public.Trip.create({
    date: '05/08/2026',
    firNumber: 'NVBNH006245YQ',
    cerCode: '170107',
    cerPrice: 17.00,
    weight: 11.8,
    transportPrice: 220.00,
    disposalPrice: 200.60, // 11.8 * 17
    fuoriRomaPrice: 0.0,
    noleggioPrice: 0.0,
    bigBagPrice: 0.0,
    analisiPrice: 0.0,
    servRagnoPrice: 0.0,
    sostaPrice: 0.0,
    address: 'VIA DEI MILLE, Roma',
    status: 'DELIVERED',
    destinationId: destViaDeiMille.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle1.id,
    wasteTypeId: wasteMap.get('170107')?.id,
  });

  await db.orm.public.Trip.create({
    date: '05/08/2026',
    firNumber: 'NVBNH006597MK',
    cerCode: '170107',
    cerPrice: 17.00,
    weight: 2.1,
    transportPrice: 130.00,
    disposalPrice: 35.70, // 2.1 * 17
    fuoriRomaPrice: 0.0,
    noleggioPrice: 0.0,
    bigBagPrice: 0.0,
    analisiPrice: 0.0,
    servRagnoPrice: 0.0,
    sostaPrice: 0.0,
    address: 'VIA DEI GIUBBONARI, Roma',
    status: 'DELIVERED',
    destinationId: destViaDeiGiubb.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle2.id,
    wasteTypeId: wasteMap.get('170107')?.id,
  });

  await db.orm.public.Trip.create({
    date: '07/08/2026',
    firNumber: 'NVBNH006651RB',
    cerCode: '170107',
    cerPrice: 17.00,
    weight: 12.05,
    transportPrice: 220.00,
    disposalPrice: 204.85, // 12.05 * 17
    fuoriRomaPrice: 0.0,
    noleggioPrice: 0.0,
    bigBagPrice: 0.0,
    analisiPrice: 0.0,
    servRagnoPrice: 0.0,
    sostaPrice: 0.0,
    address: 'VIA DEI MILLE, Roma',
    status: 'DELIVERED',
    destinationId: destViaDeiMille.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle1.id,
    wasteTypeId: wasteMap.get('170107')?.id,
  });

  await db.orm.public.Trip.create({
    date: '07/08/2026',
    firNumber: 'NVBNH006677KL',
    cerCode: '170107',
    cerPrice: 17.00,
    weight: 12.5,
    transportPrice: 250.00,
    disposalPrice: 212.50, // 12.5 * 17
    fuoriRomaPrice: 0.0,
    noleggioPrice: 0.0,
    bigBagPrice: 0.0,
    analisiPrice: 0.0,
    servRagnoPrice: 0.0,
    sostaPrice: 0.0,
    address: 'VIA DEI MILLE, Roma',
    status: 'DELIVERED',
    destinationId: destViaDeiMille.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle3.id,
    wasteTypeId: wasteMap.get('170107')?.id,
  });

  await db.orm.public.Trip.create({
    date: '11/08/2026',
    firNumber: 'NVBNH006685DX',
    cerCode: '170904',
    cerPrice: 20.00,
    weight: 13.6,
    transportPrice: 130.00,
    disposalPrice: 272.00,
    fuoriRomaPrice: 0.0,
    noleggioPrice: 0.0,
    bigBagPrice: 0.0,
    analisiPrice: 0.0,
    servRagnoPrice: 0.0,
    sostaPrice: 0.0,
    address: 'VIA DEI MILLE, Roma',
    status: 'DELIVERED',
    destinationId: destViaDeiMille.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle2.id,
    wasteTypeId: wasteMap.get('170904')?.id,
  });

  console.log('Seed completed successfully!');
}

main().catch((err) => {
  console.error('Error during seed:', err);
  process.exit(1);
});
