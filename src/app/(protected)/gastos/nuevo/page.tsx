'use client';

import React from 'react';
import FormConceptoGasto, { ConceptoGastoData } from '@/components/FormConceptoGasto';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function NuevoConceptoGastoPage() {
  const router = useRouter();

  const handleSubmit = async (data: ConceptoGastoData) => {
    try {
      const conceptosCollection = collection(db, 'conceptosGasto');
      await addDoc(conceptosCollection, data);
      alert('Concepto de gasto agregado con éxito');
      router.push('/gastos');
    } catch (error) {
      console.error('Error al agregar el concepto:', error);
      alert('Hubo un error al guardar el concepto.');
    }
  };

  return (
    <div>
      <h1>Agregar Nuevo Concepto de Gasto</h1>
      <hr className="my-4" />
      <FormConceptoGasto onSubmit={handleSubmit} />
    </div>
  );
}
