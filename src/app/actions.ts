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
      .include('producer')
      .include('recipient')
      .include('driver')
      .include('vehicle')
      .all();
    
    const companies = await db.orm.public.Company.all();
    const drivers = await db.orm.public.Driver.all();
    const vehicles = await db.orm.public.Vehicle.all();
    const wasteTypes = await db.orm.public.WasteType.all();

    return {
      trips,
      companies,
      drivers,
      vehicles,
      wasteTypes
    };
  } catch (e) {
    console.error('getTripsData error:', e);
    return { trips: [], companies: [], drivers: [], vehicles: [], wasteTypes: [] };
  }
}

export async function createTrip(data: any) {
  try {
    // Carichiamo le entità collegate per assicurarci che i dati siano coerenti
    const producer = await db.orm.public.Company.where({ id: Number(data.producerId) }).first();
    const recipient = await db.orm.public.Company.where({ id: Number(data.recipientId) }).first();
    const wasteType = await db.orm.public.WasteType.where({ id: Number(data.wasteTypeId) }).first();

    if (!producer || !recipient || !wasteType) {
      return { success: false, error: 'Produttore, Destinatario o Codice CER non trovato.' };
    }

    const tripData = {
      date: data.date,
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
      address: data.address || '',
      notes: data.notes || '',
      status: 'DELIVERED',
      producerId: producer.id,
      recipientId: recipient.id,
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
    await db.orm.public.Trip.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteTrip error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione del viaggio.' };
  }
}

// ----------------- ANAGRAFICHE -----------------

// Company
export async function createCompany(data: { name: string; address?: string; vatNumber?: string; role: string }) {
  try {
    const newCompany = await db.orm.public.Company.create({
      name: data.name,
      address: data.address || '',
      vatNumber: data.vatNumber || null,
      role: data.role,
    });
    return { success: true, company: newCompany };
  } catch (e: any) {
    console.error('createCompany error:', e);
    return { success: false, error: e.message || 'Errore nella creazione dell\'azienda.' };
  }
}

export async function deleteCompany(id: number) {
  try {
    // Rimuoviamo prima i viaggi collegati o avvisiamo (Prisma Next gestirà i vincoli di foreign key)
    await db.orm.public.Trip.where({ producerId: id }).delete();
    await db.orm.public.Trip.where({ recipientId: id }).delete();
    await db.orm.public.Company.where({ id }).delete();
    return { success: true };
  } catch (e: any) {
    console.error('deleteCompany error:', e);
    return { success: false, error: e.message || 'Errore nella rimozione dell\'azienda.' };
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
    const newWaste = await db.orm.public.WasteType.create({
      cerCode: data.cerCode,
      description: data.description || '',
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
