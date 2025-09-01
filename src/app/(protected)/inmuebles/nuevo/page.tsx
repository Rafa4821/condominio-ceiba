'use client';

import React from 'react';
import FormInmueble from '@/components/FormInmueble';
import { Inmueble } from '@/types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Excluimos 'id' ya que lo genera Firestore
type InmuebleFormData = Omit<Inmueble, 'id'>;

export default function NuevoInmueblePage() {
  const router = useRouter();

  const handleSubmit = async (data: InmuebleFormData) => {
    try {
      const inmueblesCollection = collection(db, 'inmuebles');
      await addDoc(inmueblesCollection, data);
      alert('Inmueble agregado con éxito');
      router.push('/inmuebles');
    } catch (error) {
      console.error('Error al agregar el inmueble:', error);
      alert('Hubo un error al guardar el inmueble.');
    }
  };

  return (
    <div>
      <h1>Agregar Nuevo Inmueble</h1>
      <hr className="my-4" />
      <FormInmueble onSubmit={handleSubmit} />
    </div>
  );
}
