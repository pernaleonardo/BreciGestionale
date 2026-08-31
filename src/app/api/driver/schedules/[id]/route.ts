import { NextResponse } from 'next/server';
import { db } from '../../../../../prisma/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const body = await request.json();
    const { status, loadedQuantity } = body;

    const schedule = await db.orm.public.Schedule.where({ id }).update({
      status,
      loadedQuantity: loadedQuantity ? Number(loadedQuantity) : null
    });

    // Se lo stato diventa ESEGUITO, creiamo in automatico la riga del viaggio (Trip)
    if (status === 'ESEGUITO') {
      const fullSchedule = await db.orm.public.Schedule
        .where({ id })
        .include('driver')
        .include('vehicle')
        .include('destination')
        .include('wasteType')
        .first() as any;

      if (fullSchedule && fullSchedule.destinationId && fullSchedule.firNumber && fullSchedule.wasteType) {
        // Formatta la data del viaggio da YYYY-MM-DD a DD/MM/YYYY
        let tripDate = fullSchedule.date;
        if (tripDate && tripDate.includes('-')) {
          const parts = tripDate.split('-');
          if (parts.length === 3) {
            tripDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }

        // Calcola disposalPrice = weight (loadedQuantity) * cerPrice
        const weight = fullSchedule.loadedQuantity || 0;
        const cerPrice = fullSchedule.cerPrice || 0;
        const disposalPrice = weight * cerPrice;

        // Verifica difensiva per evitare violazioni di chiavi univoche (firNumber)
        const existingTrip = await db.orm.public.Trip.where({ firNumber: fullSchedule.firNumber }).first();
        if (!existingTrip) {
          await db.orm.public.Trip.create({
            date: tripDate,
            firNumber: fullSchedule.firNumber,
            cerCode: fullSchedule.wasteType.cerCode,
            cerPrice: cerPrice,
            weight: weight,
            transportPrice: fullSchedule.transportPrice || 0,
            disposalPrice: disposalPrice,
            fuoriRomaPrice: fullSchedule.fuoriRomaPrice || 0,
            noleggioPrice: fullSchedule.noleggioPrice || 0,
            bigBagPrice: fullSchedule.bigBagPrice || 0,
            analisiPrice: fullSchedule.analisiPrice || 0,
            servRagnoPrice: fullSchedule.servRagnoPrice || 0,
            sostaPrice: fullSchedule.sostaPrice || 0,
            address: fullSchedule.destination.address,
            notes: fullSchedule.notes || '',
            status: 'DELIVERED',
            destinationId: fullSchedule.destinationId,
            driverId: fullSchedule.driverId,
            vehicleId: fullSchedule.vehicleId,
            wasteTypeId: fullSchedule.wasteTypeId,
          });
        } else {
          console.warn(`[Auto-Trip] Viaggio con FIR ${fullSchedule.firNumber} già esistente nel registro.`);
        }
      } else {
        console.warn(`[Auto-Trip] Campi necessari mancanti per creare il viaggio per la pianificazione ${id}.`);
      }
    }

    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    console.error('Update Schedule Error:', error);
    return NextResponse.json({ success: false, error: 'Errore del server' }, { status: 500 });
  }
}