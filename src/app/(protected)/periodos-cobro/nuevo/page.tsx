'use client';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface PeriodoForm {
  mes: number;
  ano: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function NuevoPeriodoPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PeriodoForm>({
    defaultValues: {
      mes: new Date().getMonth() + 1, // Mes actual por defecto
      ano: new Date().getFullYear(), // Año actual por defecto
    }
  });

  const onSubmit: SubmitHandler<PeriodoForm> = async (data) => {
    try {
      const periodosCollection = collection(db, 'periodosCobro');
      
      const newPeriodo = {
        mes: Number(data.mes),
        ano: Number(data.ano),
        gastos: [],
        totalGastosComunes: 0,
        estado: 'borrador',
        fechaCreacion: serverTimestamp(),
      };

      const docRef = await addDoc(periodosCollection, newPeriodo);
      
      alert('Período creado. Ahora puede agregar los gastos.');
      // Redirigir a la página de detalles para agregar gastos
      router.push(`/periodos-cobro/${docRef.id}`);

    } catch (error) {
      console.error('Error al crear el período:', error);
      alert('Hubo un error al crear el período.');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div>
      <h1>Crear Nuevo Período de Cobro</h1>
      <p>Seleccione el mes y el año para el nuevo período. Una vez creado, podrá registrar los gastos correspondientes.</p>
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
          {isSubmitting ? 'Creando...' : 'Crear y Continuar a Gastos'}
        </button>
      </form>
    </div>
  );
}
