'use client';

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter, useParams } from 'next/navigation';
import { PeriodoCobro } from '@/types';

interface PeriodoForm {
  mes: number;
  ano: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function EditarPeriodoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PeriodoForm>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPeriodo = async () => {
      const docRef = doc(db, 'periodosCobro', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const periodo = docSnap.data() as PeriodoCobro;
        if (periodo.estado !== 'borrador') {
          alert('Solo se pueden editar períodos en estado borrador.');
          router.push('/periodos-cobro');
          return;
        }
        reset({ mes: periodo.mes, ano: periodo.ano });
      } else {
        alert('No se encontró el período.');
        router.push('/periodos-cobro');
      }
      setLoading(false);
    };

    fetchPeriodo();
  }, [id, router, reset]);

  const onSubmit: SubmitHandler<PeriodoForm> = async (data) => {
    if (!id) return;
    try {
      const docRef = doc(db, 'periodosCobro', id);
      await updateDoc(docRef, {
        mes: Number(data.mes),
        ano: Number(data.ano),
      });
      alert('Período actualizado con éxito.');
      router.push('/periodos-cobro');
    } catch (error) {
      console.error('Error al actualizar el período:', error);
      alert('Hubo un error al actualizar el período.');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return <p>Cargando datos del período...</p>;
  }

  return (
    <div>
      <h1>Editar Período de Cobro</h1>
      <hr className="my-4" />

      <form onSubmit={handleSubmit(onSubmit)} className="w-50">
        <div className="mb-3">
          <label htmlFor="mes" className="form-label">Mes</label>
          <select {...register('mes')} className="form-select">
            {MESES.map((nombre, index) => (
              <option key={index} value={index + 1}>{nombre}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="ano" className="form-label">Año</label>
          <select {...register('ano')} className="form-select">
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}
