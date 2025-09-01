'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ConceptoGasto } from '@/types';

// Este tipo representa los datos del formulario, sin el 'id'
export interface ConceptoGastoData {
  descripcion: string;
  categoria: 'comun' | 'fondo_reserva' | 'fondo_contingencia' | 'individual' | 'fondo_estabilizacion';
}

interface FormConceptoGastoProps {
  onSubmit: SubmitHandler<ConceptoGastoData>;
  initialData?: ConceptoGasto; // Para modo edición
}

export default function FormConceptoGasto({ onSubmit, initialData }: FormConceptoGastoProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ConceptoGastoData>({
    defaultValues: initialData,
  });

  useEffect(() => {
    if (initialData) {
      const { id, ...dataToReset } = initialData;
      reset(dataToReset);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3">
        <label htmlFor="descripcion" className="form-label">Descripción</label>
        <input 
          type="text" 
          className="form-control" 
          id="descripcion"
          placeholder='Ej: Mantenimiento de Ascensores'
          {...register('descripcion', { required: 'La descripción es obligatoria' })}
        />
        {errors.descripcion && <div className="text-danger">{errors.descripcion.message}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="categoria" className="form-label">Categoría</label>
        <select 
          className="form-select"
          id="categoria"
          {...register('categoria', { required: 'Debe seleccionar una categoría' })}
        >
          <option value="comun">Gasto Común (Prorrateable)</option>
          <option value="fondo_reserva">Fondo de Reserva</option>
          <option value="fondo_contingencia">Fondo de Contingencia</option>
          <option value="fondo_estabilizacion">Fondo de Estabilización</option>
          <option value="individual">Gasto Individual (Asignación directa)</option>
        </select>
        {errors.categoria && <div className="text-danger">{errors.categoria.message}</div>}
      </div>

      <button type="submit" className="btn btn-primary">Guardar Concepto</button>
    </form>
  );
}
