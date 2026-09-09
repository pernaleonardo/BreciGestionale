import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../prisma/db';
import { cookies } from 'next/headers';

async function checkAuth() {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  return !!sessionVal;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id } = await params;
  const docId = Number(id);

  if (isNaN(docId)) {
    return NextResponse.json({ error: 'ID non valido' }, { status: 400 });
  }

  try {
    const doc = await db.orm.public.VehicleDocument.where({ id: docId }).first();

    if (!doc || !doc.fileData) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 });
    }

    // fileData format is: "data:application/pdf;base64,JVBER..."
    const dataParts = doc.fileData.split(',');
    if (dataParts.length !== 2) {
      return NextResponse.json({ error: 'Formato fileData non valido' }, { status: 500 });
    }

    const metadata = dataParts[0]; // e.g. "data:application/pdf;base64"
    const base64Data = dataParts[1];
    const mimeType = metadata.match(/data:([^;]+);/)?.[1] || 'application/octet-stream';

    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${doc.name}"`,
      },
    });

  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
