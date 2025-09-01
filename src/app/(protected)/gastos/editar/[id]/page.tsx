'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ConceptoGasto } from '@/types';
import FormConceptoGasto, { ConceptoGastoData } from '@/components/FormConceptoGasto';

export default function EditarConceptoGastoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [concepto, setConcepto] = useState<ConceptoGasto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchConcepto = async () => {
      const docRef = doc(db, 'conceptosGasto', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setConcepto({ id: docSnap.id, ...docSnap.data() } as ConceptoGasto);
      } else {
        alert('No se encontró el concepto de gasto.');
        router.push('/gastos');
      }
      setLoading(false);
    };

    fetchConcepto();
  }, [id, router]);

  const handleSubmit = async (data: ConceptoGastoData) => {
    if (!id) return;
    try {
      const docRef = doc(db, 'conceptosGasto', id);
      await updateDoc(docRef, { ...data });
      alert('Concepto de gasto actualizado con éxito');
      router.push('/gastos');
    } catch (error) {
      console.error('Error al actualizar el concepto:', error);
      alert('Hubo un error al actualizar el concepto.');
    }
  };

  if (loading) {
    return <p>Cargando datos del concepto...</p>;
  }

  return (
    <div>
      <h1>Editar Concepto de Gasto</h1>
      <hr className="my-4" />
      {concepto && (
        <FormConceptoGasto onSubmit={handleSubmit} initialData={concepto} />
      )}
    </div>
  );
}
