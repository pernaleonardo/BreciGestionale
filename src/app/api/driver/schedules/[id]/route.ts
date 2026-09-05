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

    // Note: La creazione automatica del Trip a partire dai turni ESEGUITI è stata disattivata qui
    // e spostata sul frontend tramite il pulsante "Importa Viaggi Eseguiti" (Server Action importExecutedSchedulesToTrips).

    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    console.error('Update Schedule Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Errore durante l\'aggiornamento del turno' 
    }, { status: 500 });
  }
}