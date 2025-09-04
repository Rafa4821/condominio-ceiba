'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ConceptoGasto } from '@/types';

// Este tipo representa los datos del formulario, sin el 'id'
export interface ConceptoGastoData {
  descripcion: string;
  categoria: 'comun' | 'individual';
  tipo: 'fijo' | 'variable';
  montoFijo?: number;
}

interface FormConceptoGastoProps {
  onSubmit: SubmitHandler<ConceptoGastoData>;
  initialData?: ConceptoGasto; // Para modo edición
}

export default function FormConceptoGasto({ onSubmit, initialData }: FormConceptoGastoProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ConceptoGastoData>({
    defaultValues: {
      ...initialData,
      tipo: initialData?.tipo || 'variable',
    },
  });

  const tipoGasto = watch('tipo');

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

      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="categoria" className="form-label">Categoría</label>
          <select 
            className="form-select"
            id="categoria"
            {...register('categoria', { required: 'Debe seleccionar una categoría' })}
          >
            <option value="comun">Gasto Común (Prorrateable)</option>
            <option value="individual">Gasto Individual (Asignación directa)</option>
          </select>
          {errors.categoria && <div className="text-danger">{errors.categoria.message}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="tipo" className="form-label">Tipo de Gasto</label>
          <select 
            className="form-select"
            id="tipo"
            {...register('tipo')}
          >
            <option value="variable">Variable</option>
            <option value="fijo">Fijo</option>
          </select>
        </div>
      </div>

      {tipoGasto === 'fijo' && (
        <div className="mb-3">
          <label htmlFor="montoFijo" className="form-label">Monto Fijo (USD)</label>
          <input 
            type="number"
            step="0.01"
            className="form-control"
            id="montoFijo"
            {...register('montoFijo', { 
              required: 'El monto es obligatorio para gastos fijos', 
              valueAsNumber: true,
              min: { value: 0.01, message: 'El monto debe ser mayor a cero' }
            })}
          />
          {errors.montoFijo && <div className="text-danger">{errors.montoFijo.message}</div>}
        </div>
      )}

      <button type="submit" className="btn btn-primary">Guardar Concepto</button>
    </form>
  );
}
