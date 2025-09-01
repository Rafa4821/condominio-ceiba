'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Inmueble } from '@/types';
import FormInmueble from '@/components/FormInmueble';

type InmuebleFormData = Omit<Inmueble, 'id'>;

export default function EditarInmueblePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [inmueble, setInmueble] = useState<Inmueble | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchInmueble = async () => {
      const docRef = doc(db, 'inmuebles', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setInmueble({ id: docSnap.id, ...docSnap.data() } as Inmueble);
      } else {
        alert('No se encontró el inmueble.');
        router.push('/inmuebles');
      }
      setLoading(false);
    };

    fetchInmueble();
  }, [id, router]);

  const handleSubmit = async (data: InmuebleFormData) => {
    if (!id) return;
    try {
      const docRef = doc(db, 'inmuebles', id);
      await updateDoc(docRef, data);
      alert('Inmueble actualizado con éxito');
      router.push('/inmuebles');
    } catch (error) {
      console.error('Error al actualizar el inmueble:', error);
      alert('Hubo un error al actualizar el inmueble.');
    }
  };

  if (loading) {
    return <p>Cargando datos del inmueble...</p>;
  }

  return (
    <div>
      <h1>Editar Inmueble</h1>
      <hr className="my-4" />
      {inmueble && (
        <FormInmueble onSubmit={handleSubmit} initialData={inmueble} />
      )}
    </div>
  );
}
