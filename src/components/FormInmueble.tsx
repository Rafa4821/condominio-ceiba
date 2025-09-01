'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Inmueble } from '@/types';

// Usamos Omit para excluir el 'id' al crear un nuevo inmueble
type InmuebleFormData = Omit<Inmueble, 'id'>;

interface FormInmuebleProps {
  onSubmit: SubmitHandler<InmuebleFormData>;
  initialData?: Inmueble; // Opcional, para pre-llenar el formulario en modo edición
  isEdit?: boolean;
}

export default function FormInmueble({ onSubmit, initialData, isEdit = false }: FormInmuebleProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<InmuebleFormData>({
    defaultValues: initialData || { saldoAnterior: 0 },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Datos del Inmueble */}
      <div className="mb-3">
        <label htmlFor="identificador" className="form-label">Identificador</label>
        <input 
          type="text" 
          className="form-control" 
          id="identificador"
          placeholder='Ej: Apto 10-A, Casa 25'
          {...register('identificador', { required: 'El identificador es obligatorio' })}
        />
        {errors.identificador && <div className="text-danger">{errors.identificador.message}</div>}
      </div>

      {/* Datos del Propietario */}
      <h5>Propietario</h5>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label htmlFor="propietario.nombre" className="form-label">Nombre</label>
          <input {...register('propietario.nombre', { required: true })} className="form-control" />
        </div>
        <div className="col-md-6">
          <label htmlFor="propietario.email" className="form-label">Email</label>
          <input type="email" {...register('propietario.email', { required: true })} className="form-control" />
        </div>
        <div className="col-md-6">
          <label htmlFor="propietario.telefono" className="form-label">Teléfono (Opcional)</label>
          <input {...register('propietario.telefono')} className="form-control" />
        </div>
      </div>

      {/* Datos Financieros */}
      <h5>Datos Financieros</h5>
       <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label htmlFor="alicuota" className="form-label">Alícuota (%)</label>
          <input 
            type="number" 
            step="0.001" 
            className="form-control" 
            {...register('alicuota', { required: 'La alícuota es obligatoria', valueAsNumber: true, min: 0 })}
          />
          {errors.alicuota && <div className="text-danger">{errors.alicuota.message}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="saldoAnterior" className="form-label">Saldo Anterior (USD)</label>
          <input 
            type="number" 
            step="0.01" 
            className="form-control" 
            {...register('saldoAnterior', { required: true, valueAsNumber: true })}
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary">Guardar Inmueble</button>
    </form>
  );
}
