import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';

export async function DELETE(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const periodoId = pathname.split('/').pop();

  if (!periodoId) {
    return NextResponse.json({ error: 'ID de período no proporcionado' }, { status: 400 });
  }

  try {
    const batch = writeBatch(db);

    // 1. Encontrar y eliminar todos los recibos asociados
    const recibosQuery = query(collection(db, 'recibos'), where('periodoId', '==', periodoId));
    const recibosSnapshot = await getDocs(recibosQuery);
    recibosSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 2. Desvincular todos los gastos asociados (establecer periodoId a null)
    const gastosQuery = query(collection(db, 'gastos'), where('periodoId', '==', periodoId));
    const gastosSnapshot = await getDocs(gastosQuery);
    gastosSnapshot.forEach(doc => {
      batch.update(doc.ref, { periodoId: null });
    });

    // 3. Eliminar el período de cobro
    const periodoRef = doc(db, 'periodosCobro', periodoId);
    batch.delete(periodoRef);

    // Ejecutar todas las operaciones en un lote
    await batch.commit();

    return NextResponse.json({ message: 'Período y datos asociados eliminados con éxito' });

  } catch (error) {
    console.error('Error al eliminar el período de cobro:', error);
    return NextResponse.json({ error: 'Error interno del servidor al eliminar el período' }, { status: 500 });
  }
}
