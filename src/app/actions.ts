'use server';

import { cookies } from 'next/headers';
import { db } from '../prisma/db';
import type { Contract } from '../prisma/contract.d';

// Helper per verificare se l'utente è autenticato ed è amministratore
async function checkAdmin() {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) {
    throw new Error('Non autenticato');
  }
  const user = JSON.parse(sessionVal);
  if (user.role !== 'ADMIN') {
    throw new Error('Azione riservata all\'amministratore');
  }
  return user;
}

// ----------------- AUTENTICAZIONE -----------------

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Inserisci email e password.' };
  }

  try {
    const user = await db.orm.public.User.where({ email }).first();

    if (!user || user.password !== password) {
      return { success: false, error: 'Credenziali non valide.' };
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role,
    };

    const cookieStore = await cookies();
    cookieStore.set('session', JSON.stringify(sessionData), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 giorno
    });

    return { success: true, user: sessionData };
  } catch (err: any) {
    console.error('Login error:', err);
    return { success: false, error: 'Errore interno del server durante il login.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return { success: true };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) return null;
  try {
    return JSON.parse(sessionVal);
  } catch (e) {
    return null;
  }
}

// ----------------- GESTIONE UTENTI (ADMIN ONLY) -----------------

export async function getUsers() {
  try {
    await checkAdmin();
    return await db.orm.public.User.all();
  } catch (e) {
    console.error('getUsers error:', e);
    return [];
  }
}

export async function createUser(data: { email: string; name?: string; password?: string; role?: string }) {
  try {
    await checkAdmin();
    const newUser = await db.orm.public.User.create({
      email: data.email,
      name: data.name || '',
      password: data.password || 'operator',
      role: data.role || 'OPERATOR',
    });
    return { success: true, user: newUser };
  } catch (e: any) {
    console.error('createUser error:', e);
    return { success: false, error: e.message || 'Errore nella creazione dell\'utente.' };
  }
}

export async function deleteUser(id: number) {
  try {
    await checkAdmin();
    await db.orm.public.User.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteUser error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione dell\'utente.' };
  }
}

// ----------------- REGISTRO VIAGGI (TRIPS) -----------------

export async function getTripsData() {
  try {
    const trips = await db.orm.public.Trip
      .include('destination', (dest) => dest.include('client'))
      .include('driver')
      .include('vehicle')
      .all();
    
    const clients = await db.orm.public.Client.all();
    const destinations = await db.orm.public.Destination.include('client').all();
    const drivers = await db.orm.public.Driver.all();
    const vehicles = await db.orm.public.Vehicle.all();
    const wasteTypes = await db.orm.public.WasteType.all();
    const disposalPrices = await db.orm.public.DisposalPrice.include('client').include('wasteType').all();
    const transportPrices = await db.orm.public.TransportPrice.include('client').include('vehicle').all();

    return {
      trips,
      clients,
      destinations,
      drivers,
      vehicles,
      wasteTypes,
      disposalPrices,
      transportPrices
    };
  } catch (e) {
    console.error('getTripsData error:', e);
    return { trips: [], clients: [], destinations: [], drivers: [], vehicles: [], wasteTypes: [], disposalPrices: [], transportPrices: [] };
  }
}

export async function createTrip(data: any) {
  try {
    // Carichiamo le entità collegate per assicurarci che i dati siano coerenti
    const destination = await db.orm.public.Destination.where({ id: Number(data.destinationId) }).first();
    const wasteType = await db.orm.public.WasteType.where({ id: Number(data.wasteTypeId) }).first();

    if (!destination || !wasteType) {
      return { success: false, error: 'Destinazione o Codice CER non trovato.' };
    }

    // Convert date from YYYY-MM-DD to DD/MM/YYYY if needed
    let tripDate = data.date;
    if (tripDate && tripDate.includes('-')) {
      const parts = tripDate.split('-');
      if (parts.length === 3) {
        tripDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const tripData = {
      date: tripDate,
      firNumber: data.firNumber,
      cerCode: wasteType.cerCode,
      cerPrice: Number(data.cerPrice || 0),
      weight: Number(data.weight || 0),
      transportPrice: Number(data.transportPrice || 0),
      disposalPrice: Number(data.disposalPrice || 0),
      fuoriRomaPrice: Number(data.fuoriRomaPrice || 0),
      noleggioPrice: Number(data.noleggioPrice || 0),
      bigBagPrice: Number(data.bigBagPrice || 0),
      analisiPrice: Number(data.analisiPrice || 0),
      servRagnoPrice: Number(data.servRagnoPrice || 0),
      sostaPrice: Number(data.sostaPrice || 0),
      address: destination.address,
      notes: data.notes || '',
      status: 'DELIVERED',
      destinationId: destination.id,
      driverId: data.driverId ? Number(data.driverId) : null,
      vehicleId: data.vehicleId ? Number(data.vehicleId) : null,
      wasteTypeId: wasteType.id,
    };

    const newTrip = await db.orm.public.Trip.create(tripData);
    return { success: true, trip: newTrip };
  } catch (e: any) {
    console.error('createTrip error:', e);
    return { success: false, error: e.message || 'Errore nella creazione del viaggio.' };
  }
}

export async function deleteTrip(id: number) {
  try {
    await db.orm.public.GPSLog.where({ tripId: id }).deleteAll();
    await db.orm.public.Trip.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteTrip error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione del viaggio.' };
  }
}

// ----------------- ANAGRAFICHE -----------------

// Client
export async function createClient(data: { name: string; billingAddress?: string; vatNumber?: string; clientCode: string }) {
  try {
    const newClient = await db.orm.public.Client.create({
      name: data.name,
      billingAddress: data.billingAddress || '',
      vatNumber: data.vatNumber || null,
      clientCode: data.clientCode,
    });
    return { success: true, client: newClient };
  } catch (e: any) {
    console.error('createClient error:', e);
    return { success: false, error: e.message || 'Errore nella creazione del cliente.' };
  }
}

export async function deleteClient(id: number) {
  try {
    const destinations = await db.orm.public.Destination.where({ clientId: id }).all();
    for (const dest of destinations) {
      await db.orm.public.Trip.where({ destinationId: dest.id }).deleteAll();
    }
    await db.orm.public.Destination.where({ clientId: id }).deleteAll();
    await db.orm.public.Client.where({ id }).deleteAll();
    return { success: true };
  } catch (e: any) {
    console.error('deleteClient error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione del cliente.' };
  }
}

// Destination
export async function createDestination(data: { name: string; address: string; shippingCode: string; clientId: number }) {
  try {
    const newDestination = await db.orm.public.Destination.create({
      name: data.name,
      address: data.address,
      shippingCode: data.shippingCode,
      clientId: Number(data.clientId),
    });
    return { success: true, destination: newDestination };
  } catch (e: any) {
    console.error('createDestination error:', e);
    return { success: false, error: e.message || 'Errore nella creazione della destinazione.' };
  }
}

export async function deleteDestination(id: number) {
  try {
    await db.orm.public.Trip.where({ destinationId: id }).deleteAll();
    await db.orm.public.Destination.where({ id }).deleteAll();
    return { success: true };
  } catch (e: any) {
    console.error('deleteDestination error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione della destinazione.' };
  }
}

// Driver
export async function createDriver(data: { name: string; email: string; phone?: string; licenseNumber?: string }) {
  try {
    const newDriver = await db.orm.public.Driver.create({
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      licenseNumber: data.licenseNumber || '',
      status: 'AVAILABLE',
    });
    return { success: true, driver: newDriver };
  } catch (e: any) {
    console.error('createDriver error:', e);
    return { success: false, error: e.message || 'Errore nella creazione dell\'autista.' };
  }
}

export async function deleteDriver(id: number) {
  try {
    // Svincoliamo i viaggi collegati impostando driverId a null
    await db.orm.public.Trip.where({ driverId: id }).update({ driverId: null });
    await db.orm.public.Driver.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteDriver error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione dell\'autista.' };
  }
}

// Vehicle
export async function createVehicle(data: { plateNumber: string; model?: string; capacity?: string | number }) {
  try {
    const newVehicle = await db.orm.public.Vehicle.create({
      plateNumber: data.plateNumber,
      model: data.model || '',
      capacity: data.capacity ? Number(data.capacity) : null,
      status: 'ACTIVE',
    });
    return { success: true, vehicle: newVehicle };
  } catch (e: any) {
    console.error('createVehicle error:', e);
    return { success: false, error: e.message || 'Errore nella creazione del veicolo.' };
  }
}

export async function deleteVehicle(id: number) {
  try {
    // Svincoliamo i viaggi collegati impostando vehicleId a null
    await db.orm.public.Trip.where({ vehicleId: id }).update({ vehicleId: null });
    await db.orm.public.Vehicle.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteVehicle error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione del veicolo.' };
  }
}

// WasteType / Articoli (CER)
export async function createWasteType(data: { cerCode: string; description?: string }) {
  try {
    const cleanCode = data.cerCode.replace(/\s+/g, '');
    const prefix = cleanCode.substring(0, 2);
    const defaultCategories: { [key: string]: string } = {
      '01': 'Rifiuti da estrazione e prospezione di miniere e cave',
      '02': 'Rifiuti da agricoltura, selvicoltura, caccia e pesca',
      '03': 'Rifiuti da lavorazione del legno, carta e cartone',
      '04': 'Rifiuti da industria tessile e conciaria',
      '05': 'Rifiuti da raffinazione del petrolio e trattamento carbone',
      '06': 'Rifiuti da processi chimici inorganici',
      '07': 'Rifiuti da processi chimici organici',
      '08': 'Rifiuti da produzione di vernici, pitture, inchiostri e adesivi',
      '09': 'Rifiuti dell\'industria fotografica',
      '10': 'Rifiuti provenienti da processi termici',
      '11': 'Rifiuti da trattamento chimico e rivestimento di metalli',
      '12': 'Rifiuti da lavorazione fisica e meccanica di metalli e plastica',
      '13': 'Oli esausti e residui di combustibili liquidi',
      '14': 'Solventi organici e refrigeranti esausti',
      '15': 'Imballaggi, assorbenti, stracci e materiali filtranti',
      '16': 'Rifiuti non specificati altrove nel catalogo',
      '17': 'Rifiuti da operazioni di costruzione e demolizione',
      '18': 'Rifiuti sanitari e veterinari o da attività di ricerca',
      '19': 'Rifiuti da impianti di trattamento rifiuti e acque reflue',
      '20': 'Rifiuti urbani e domestici della raccolta differenziata'
    };
    const categoryName = defaultCategories[prefix] || 'Altro';
    const finalCategory = defaultCategories[prefix] ? `${prefix} - ${categoryName}` : 'Altro';

    const newWaste = await db.orm.public.WasteType.create({
      cerCode: data.cerCode,
      description: data.description || '',
      category: finalCategory,
    });
    return { success: true, wasteType: newWaste };
  } catch (e: any) {
    console.error('createWasteType error:', e);
    return { success: false, error: e.message || 'Errore nella creazione del codice CER.' };
  }
}

export async function deleteWasteType(id: number) {
  try {
    // Svincoliamo i viaggi collegati impostando wasteTypeId a null
    await db.orm.public.Trip.where({ wasteTypeId: id }).update({ wasteTypeId: null });
    await db.orm.public.WasteType.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteWasteType error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione del codice CER.' };
  }
}

// ----------------- LISTINI (PRICES) -----------------

export async function createDisposalPrice(data: { clientId?: number | string | null; wasteTypeId: number; pricePerQuintal: number }) {
  try {
    const cId = data.clientId && data.clientId !== '' ? Number(data.clientId) : null;
    const newPrice = await db.orm.public.DisposalPrice.create({
      clientId: cId,
      wasteTypeId: Number(data.wasteTypeId),
      pricePerQuintal: Number(data.pricePerQuintal || 0),
    });
    return { success: true, disposalPrice: newPrice };
  } catch (e: any) {
    console.error('createDisposalPrice error:', e);
    return { success: false, error: e.message || 'Errore nella creazione del listino smaltimento.' };
  }
}

export async function deleteDisposalPrice(id: number) {
  try {
    await db.orm.public.DisposalPrice.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteDisposalPrice error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione del listino smaltimento.' };
  }
}

export async function createTransportPrice(data: { clientId?: number | string | null; vehicleId: number; price: number }) {
  try {
    const cId = data.clientId && data.clientId !== '' ? Number(data.clientId) : null;
    const newPrice = await db.orm.public.TransportPrice.create({
      clientId: cId,
      vehicleId: Number(data.vehicleId),
      price: Number(data.price || 0),
    });
    return { success: true, transportPrice: newPrice };
  } catch (e: any) {
    console.error('createTransportPrice error:', e);
    return { success: false, error: e.message || 'Errore nella creazione del listino trasporto.' };
  }
}

export async function deleteTransportPrice(id: number) {
  try {
    await db.orm.public.TransportPrice.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteTransportPrice error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione del listino trasporto.' };
  }
}

export async function upsertDisposalPrice(data: { clientId?: number | null; wasteTypeId: number; pricePerQuintal: number }) {
  try {
    const cId = data.clientId ?? null;
    const existing = await db.orm.public.DisposalPrice
      .where({ wasteTypeId: Number(data.wasteTypeId), clientId: cId })
      .first();

    if (existing) {
      await db.orm.public.DisposalPrice
        .where({ id: existing.id })
        .update({ pricePerQuintal: Number(data.pricePerQuintal) });
      return { success: true, action: 'updated' };
    } else {
      await db.orm.public.DisposalPrice.create({
        clientId: cId,
        wasteTypeId: Number(data.wasteTypeId),
        pricePerQuintal: Number(data.pricePerQuintal),
      });
      return { success: true, action: 'created' };
    }
  } catch (e: any) {
    console.error('upsertDisposalPrice error:', e);
    return { success: false, error: e.message || 'Errore nell\'aggiornamento del listino smaltimento.' };
  }
}

export async function upsertTransportPrice(data: { clientId?: number | null; vehicleId: number; price: number }) {
  try {
    const cId = data.clientId ?? null;
    const existing = await db.orm.public.TransportPrice
      .where({ vehicleId: Number(data.vehicleId), clientId: cId })
      .first();

    if (existing) {
      await db.orm.public.TransportPrice
        .where({ id: existing.id })
        .update({ price: Number(data.price) });
      return { success: true, action: 'updated' };
    } else {
      await db.orm.public.TransportPrice.create({
        clientId: cId,
        vehicleId: Number(data.vehicleId),
        price: Number(data.price),
      });
      return { success: true, action: 'created' };
    }
  } catch (e: any) {
    console.error('upsertTransportPrice error:', e);
    return { success: false, error: e.message || 'Errore nell\'aggiornamento del listino trasporto.' };
  }
}

// ----------------- PIANIFICAZIONE (SCHEDULES) -----------------

export async function getWeeklySchedulesData(startDateStr: string, endDateStr: string) {
  try {
    const dates = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }

    const promises = dates.map(date => 
      db.orm.public.Schedule.where({ date }).include('driver').include('vehicle').all()
    );
    
    const results = await Promise.all(promises);
    const schedules = results.flat();
    
    return { success: true, schedules };
  } catch (e: any) {
    console.error('getWeeklySchedulesData error:', e);
    return { success: false, error: e.message || 'Errore nel recupero della pianificazione settimanale.' };
  }
}

export async function getSchedulesData(date: string) {
  try {
    const schedules = await db.orm.public.Schedule
      .where({ date })
      .include('driver')
      .include('vehicle')
      .all();
    return { success: true, schedules };
  } catch (e: any) {
    console.error('getSchedulesData error:', e);
    return { success: false, error: e.message || 'Errore nel recupero della pianificazione.' };
  }
}

export async function createSchedule(data: {
  date: string;
  startDate: string;
  endDate: string;
  driverId: number;
  vehicleId: number;
  notes?: string;
}) {
  try {
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      return { success: false, error: 'La data/ora di inizio deve essere precedente alla data/ora di fine.' };
    }

    const newSchedule = await db.orm.public.Schedule.create({
      date: data.date,
      startDate: data.startDate,
      endDate: data.endDate,
      driverId: Number(data.driverId),
      vehicleId: Number(data.vehicleId),
      notes: data.notes || '',
    });
    return { success: true, schedule: newSchedule };
  } catch (e: any) {
    console.error('createSchedule error:', e);
    return { success: false, error: e.message || 'Errore nella creazione della pianificazione.' };
  }
}

export async function deleteSchedule(id: number) {
  try {
    await db.orm.public.Schedule.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteSchedule error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione della pianificazione.' };
  }
}
