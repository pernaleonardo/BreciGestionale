import { NextResponse } from 'next/server';
import { db } from '../../../../prisma/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email richiesta' }, { status: 400 });
    }

    const drivers = await db.orm.public.Driver.where({ email }).all();
    if (drivers.length === 0) {
      return NextResponse.json({ success: false, error: 'Nessun autista trovato con questa email' }, { status: 404 });
    }

    const driver = drivers[0];
    
    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email
      }
    });

  } catch (error: any) {
    console.error('Driver Login Error:', error);
    return NextResponse.json({ success: false, error: 'Errore del server' }, { status: 500 });
  }
}