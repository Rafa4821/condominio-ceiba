import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recibo, Condominio, PeriodoCobro, Inmueble } from '@/types';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { renderToStream } from '@react-pdf/renderer';
import { ReceiptEmail } from '@/emails/ReceiptEmail';
import { ReciboPDF } from '@/components/pdf/ReciboPDF';

const resend = new Resend(process.env.RESEND_API_KEY);
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function POST(req: NextRequest) {
  try {
    const { receiptId } = await req.json();
    if (!receiptId) {
      return new NextResponse('Falta el ID del recibo', { status: 400 });
    }

    // 1. Obtener todos los datos necesarios
    const reciboRef = doc(db, 'recibos', receiptId);
    const reciboSnap = await getDoc(reciboRef);
    if (!reciboSnap.exists()) {
      return new NextResponse('Recibo no encontrado', { status: 404 });
    }
    const recibo = { id: reciboSnap.id, ...reciboSnap.data() } as Recibo;

    const inmuebleRef = doc(db, 'inmuebles', recibo.inmuebleId);
    const inmuebleSnap = await getDoc(inmuebleRef);
    if (!inmuebleSnap.exists()) {
        return new NextResponse('Inmueble no encontrado', { status: 404 });
    }
    const inmueble = inmuebleSnap.data() as Inmueble;

    if (!inmueble.propietario.email) {
      return new NextResponse('El inmueble no tiene un email configurado para el propietario.', { status: 400 });
    }

    const periodoRef = doc(db, 'periodosCobro', recibo.periodoId);
    const periodoSnap = await getDoc(periodoRef);
    if (!periodoSnap.exists()) {
      return new NextResponse('Período no encontrado', { status: 404 });
    }
    const periodo = periodoSnap.data() as PeriodoCobro;

    const condominioRef = doc(db, 'condominio', 'main');
    const condominioSnap = await getDoc(condominioRef);
    if (!condominioSnap.exists()) {
      return new NextResponse('Datos del condominio no encontrados', { status: 404 });
    }
    const condominio = condominioSnap.data() as Condominio;

    // 2. Generar el PDF en buffer
    const pdfStream = await renderToStream(
      <ReciboPDF 
        recibo={recibo} 
        condominio={condominio} 
        periodo={periodo}
      />
    );
    const pdfBuffer = await streamToBuffer(pdfStream);

    // 3. Renderizar el HTML del correo
    const emailHtml = await render(
      <ReceiptEmail 
        recibo={recibo} 
        condominio={condominio} 
        periodo={periodo}
      />
    );

    // 4. Enviar el correo
    const fromAddress = process.env.NODE_ENV === 'development'
      ? 'Condominio Ceiba <onboarding@resend.dev>'
      : process.env.RESEND_FROM!;

    const toAddress = process.env.NODE_ENV === 'development'
      ? ['rafaellucero998@gmail.com']
      : [inmueble.propietario.email];

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject: `Recibo de Condominio: ${MESES[periodo.mes - 1]} ${periodo.ano}`,
      html: emailHtml,
      attachments: [
        {
          filename: `recibo-${recibo.inmuebleInfo.identificador}-${MESES[periodo.mes - 1]}-${periodo.ano}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Error de Resend:', error);
      return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Correo enviado con éxito', data });

  } catch (error) {
    console.error('Error en la API send-receipt:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
