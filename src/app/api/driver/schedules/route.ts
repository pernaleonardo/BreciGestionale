import { NextResponse } from 'next/server';
import { db } from '../../../../prisma/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json({ success: false, error: 'driverId mancante' }, { status: 400 });
    }

    const schedules = await db.orm.public.Schedule
      .where({ driverId: Number(driverId) })
      .include('vehicle')
      .all();

    schedules.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return NextResponse.json({ success: true, schedules });
  } catch (error: any) {
    console.error('Get Schedules Error:', error);
    return NextResponse.json({ success: false, error: 'Errore del server' }, { status: 500 });
  }
}