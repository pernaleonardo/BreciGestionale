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

    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    console.error('Update Schedule Error:', error);
    return NextResponse.json({ success: false, error: 'Errore del server' }, { status: 500 });
  }
}