import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Condominio, Inmueble, PeriodoCobro, Recibo } from '@/types';
import { ReciboPDF } from '@/components/pdf/ReciboPDF';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReceiptEmail } from '@/emails/ReceiptEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];


export async function POST(req: Request) {
  try {
    const { periodoId } = await req.json();
    if (!periodoId) {
      return new NextResponse('Falta el ID del período', { status: 400 });
    }

    // 1. Obtener datos del período y condominio
    const periodoRef = doc(db, 'periodosCobro', periodoId);
    const condominioRef = doc(db, 'condominio', 'main');
    
    const [periodoSnap, condominioSnap] = await Promise.all([getDoc(periodoRef), getDoc(condominioRef)]);

    if (!periodoSnap.exists()) return new NextResponse('Período no encontrado', { status: 404 });
    if (!condominioSnap.exists()) return new NextResponse('Condominio no encontrado', { status: 404 });

    const periodo = periodoSnap.data() as PeriodoCobro;
    const condominio = condominioSnap.data() as Condominio;

    // 2. Obtener todos los recibos del período
    const recibosQuery = query(collection(db, 'recibos'), where('periodoId', '==', periodoId));
    const recibosSnap = await getDocs(recibosQuery);
    const recibos = recibosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Recibo[];

    if (recibos.length === 0) {
      return NextResponse.json({ message: 'No hay recibos para enviar en este período.' });
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { email: string, error: unknown }[],
    };

    // 3. Iterar y enviar cada correo individualmente
    for (const recibo of recibos) {
      const inmuebleRef = doc(db, 'inmuebles', recibo.inmuebleId);
      const inmuebleSnap = await getDoc(inmuebleRef);
      const propietarioEmail = inmuebleSnap.exists() ? (inmuebleSnap.data() as Inmueble).propietario.email : null;

      if (!propietarioEmail) {
        results.failed++;
        results.errors.push({ email: `Inmueble ID: ${recibo.inmuebleId}`, error: 'Email no encontrado' });
        continue;
      }

      try {
        const pdfBuffer = await renderToBuffer(<ReciboPDF recibo={recibo} condominio={condominio} periodo={periodo} />);

        const toAddress = process.env.NODE_ENV === 'development' ? 'rafaellucero998@gmail.com' : propietarioEmail;

        const fromAddress = process.env.NODE_ENV === 'development'
          ? 'Condominio Ceiba <onboarding@resend.dev>'
          : process.env.RESEND_FROM!;

        const { error } = await resend.emails.send({
          from: fromAddress,
          to: toAddress,
          subject: `Recibo de Condominio: ${MESES[periodo.mes - 1]} ${periodo.ano}`,
          react: <ReceiptEmail recibo={recibo} condominio={condominio} periodo={periodo} />,
          attachments: [
            {
              filename: `recibo-${recibo.inmuebleInfo.identificador}-${MESES[periodo.mes - 1]}-${periodo.ano}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        if (error) {
          throw error;
        }

        results.sent++;

      } catch (error: unknown) {
        console.error(`Error enviando a ${propietarioEmail}:`, error);
        results.failed++;
        results.errors.push({ email: propietarioEmail, error });
      }
    }

    return NextResponse.json({ 
      message: `Proceso completado. Enviados: ${results.sent}, Fallidos: ${results.failed}.`,
      details: results
    });

  } catch (error) {
    console.error('Error en la API send-bulk-receipts:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
