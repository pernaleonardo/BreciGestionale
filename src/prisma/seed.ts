// @ts-ignore
import { db } from './db.ts';

async function main() {
  console.log('Cleaning up database...');
  await db.orm.public.GPSLog.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Trip.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Destination.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Client.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Driver.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.Vehicle.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.WasteType.where((f) => f.id.gt(0)).deleteAll();
  await db.orm.public.User.where((f) => f.id.gt(0)).deleteAll();

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
  const destViaDeiMille = await db.orm.public.Destination.create({
    name: 'VIA DEI MILLE',
    address: 'VIA DEI MILLE, Roma',
    shippingCode: 'MILLE-01',
    clientId: pmGroup.id,
  });

  const destViaDeiGiubb = await db.orm.public.Destination.create({
    name: 'VIA DEI GIUBB...',
    address: 'VIA DEI GIUBBONARI, Roma',
    shippingCode: 'GIUBB-01',
    clientId: pmGroup.id,
  });

  // Create drivers
  const driverLeonardo = await db.orm.public.Driver.create({
    name: 'Leonardo Perna',
    email: 'perna.leonardo@gmail.com',
    phone: '+39 333 1234567',
    licenseNumber: 'U1C234567K',
    status: 'AVAILABLE',
  });

  // Create vehicles
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

  // Create waste types
  const waste170802 = await db.orm.public.WasteType.create({
    cerCode: '170802',
    description: 'Materiali da costruzione a base di gesso diversi da quelli di cui alla voce 17 08 01',
  });

  const waste170107 = await db.orm.public.WasteType.create({
    cerCode: '170107',
    description: 'Miscugli o scorie di cemento, mattoni, mattonelle e ceramiche, diverse da quelle di cui alla voce 17 01 06',
  });

  const waste170904 = await db.orm.public.WasteType.create({
    cerCode: '170904',
    description: 'Rifiuti misti dell\'attività di costruzione e demolizione, diversi da quelli di cui alle voci 17 09 01, 17 09 02 e 17 09 03',
  });

  // Create trips (from user's Excel sheet)
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
    address: 'VIA DEI MILLE',
    status: 'DELIVERED',
    destinationId: destViaDeiMille.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle1.id,
    wasteTypeId: waste170107.id,
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
    address: 'VIA DEI GIUBB...',
    status: 'DELIVERED',
    destinationId: destViaDeiGiubb.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle2.id,
    wasteTypeId: waste170107.id,
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
    address: 'VIA DEI MILLE',
    status: 'DELIVERED',
    destinationId: destViaDeiMille.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle1.id,
    wasteTypeId: waste170107.id,
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
    address: 'VIA DEI MILLE',
    status: 'DELIVERED',
    destinationId: destViaDeiMille.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle3.id,
    wasteTypeId: waste170107.id,
  });

  await db.orm.public.Trip.create({
    date: '11/08/2026',
    firNumber: 'NVBNH006685DX',
    cerCode: '170904 MISTO',
    cerPrice: 0.40,
    weight: 680.0,
    transportPrice: 130.00,
    disposalPrice: 272.00,
    fuoriRomaPrice: 0.0,
    noleggioPrice: 0.0,
    bigBagPrice: 0.0,
    analisiPrice: 0.0,
    servRagnoPrice: 0.0,
    sostaPrice: 0.0,
    address: 'VIA DEI MILLE',
    status: 'DELIVERED',
    destinationId: destViaDeiMille.id,
    driverId: driverLeonardo.id,
    vehicleId: vehicle2.id,
    wasteTypeId: waste170904.id,
  });

  console.log('Seed completed successfully!');
}

main().catch((err) => {
  console.error('Error during seed:', err);
  process.exit(1);
});
