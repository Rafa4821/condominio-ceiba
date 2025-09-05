'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Condominio } from '@/types';

// El ID del documento de configuración será fijo para simplificar
const CONFIG_ID = 'main';

// Usamos Omit para quitar el id y la moneda, ya que se manejan internamente
type CondominioFormData = Omit<Condominio, 'id' | 'moneda' | 'logoUrl' | 'logoPath'> & {
  logo?: FileList;
};

export default function ConfiguracionPage() {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<CondominioFormData>();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoPath, setExistingLogoPath] = useState<string | null>(null);

  const logoFile = watch('logo');

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, 'condominio', CONFIG_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // El tipo de `docSnap.data()` es genérico, lo casteamos a lo que esperamos
        const data = docSnap.data() as Condominio;
        reset(data);
        if (data.logoPath) {
          setExistingLogoPath(data.logoPath);
          // Generar una URL de descarga para la vista previa del logo existente
          const storage = getStorage();
          const logoRef = ref(storage, data.logoPath);
          getDownloadURL(logoRef).then(url => setLogoPreview(url));
        }
      }
    };
    fetchConfig();
  }, [reset]);

  useEffect(() => {
    if (logoFile && logoFile.length > 0) {
      const file = logoFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  }, [logoFile]);

  const onSubmit: SubmitHandler<CondominioFormData> = async (data) => {
    let logoPath = existingLogoPath;

    if (data.logo && data.logo.length > 0) {
      const file = data.logo[0];
      const storage = getStorage();
      const storageRef = ref(storage, `config/logo/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        logoPath = storageRef.fullPath; // Guardamos la ruta completa del archivo
      } catch (error) {
        console.error('Error al subir el logo:', error);
        alert('Hubo un error al subir el logo.');
        return; // No continuar si la subida falla
      }
    }

    const { ...formData } = data; // Excluir el campo 'logo' de los datos a guardar

    try {
      const docRef = doc(db, 'condominio', CONFIG_ID);
      // Usamos setDoc con merge:true para crear o actualizar el documento
      // Se añade la moneda fija 'USD' al guardar
      await setDoc(docRef, { ...formData, logoPath, moneda: 'USD' }, { merge: true });
      alert('Configuración guardada con éxito.');
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      alert('Hubo un error al guardar los datos.');
    }
  };

  return (
    <div>
      <h1>Configuración del Condominio</h1>
      <p>Estos datos se usarán para generar los recibos de condominio.</p>
      <hr className="my-4" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label htmlFor="nombre" className="form-label">Nombre del Condominio</label>
          <input {...register('nombre', { required: 'El nombre es obligatorio' })} className="form-control" />
          {errors.nombre && <p className="text-danger">{errors.nombre.message}</p>}
        </div>

        <div className="mb-3">
          <label htmlFor="rif" className="form-label">RIF</label>
          <input {...register('rif', { required: 'El RIF es obligatorio' })} className="form-control" placeholder="J-12345678-9" />
          {errors.rif && <p className="text-danger">{errors.rif.message}</p>}
        </div>

        <div className="mb-3">
          <label htmlFor="direccion" className="form-label">Dirección</label>
          <textarea {...register('direccion')} className="form-control" rows={2}></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="datosBancarios" className="form-label">Datos Bancarios</label>
          <textarea 
            {...register('datosBancarios', { required: 'Los datos bancarios son obligatorios' })}
            className="form-control" 
            rows={3}
            placeholder='Ej: BANCO MERCANTIL\nCUENTA No. 0105-0145-8011-4514-1986\nASOCIACIÓN CIVIL CONJUNTO RESIDENCIAL VILLA CEIBA'
          ></textarea>
          {errors.datosBancarios && <p className="text-danger">{errors.datosBancarios.message}</p>}
        </div>
        
        <hr className="my-4" />

        <h5>Fondos y Reservas</h5>
        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="porcentajeFondoReserva" className="form-label">Fondo de Reserva (%)</label>
            <input 
              type="number"
              step="0.1"
              {...register('porcentajeFondoReserva', { 
                required: 'El porcentaje es obligatorio', 
                valueAsNumber: true,
                min: { value: 0, message: 'El valor no puede ser negativo' }
              })} 
              className="form-control" 
              placeholder="10"
            />
            {errors.porcentajeFondoReserva && <p className="text-danger">{errors.porcentajeFondoReserva.message}</p>}
          </div>
          <div className="col-md-6">
            <label htmlFor="porcentajeFondoContingencia" className="form-label">Fondo de Contingencia (%)</label>
            <input 
              type="number"
              step="0.1"
              {...register('porcentajeFondoContingencia', { 
                required: 'El porcentaje es obligatorio', 
                valueAsNumber: true,
                min: { value: 0, message: 'El valor no puede ser negativo' }
              })} 
              className="form-control" 
              placeholder="23.5"
            />
            {errors.porcentajeFondoContingencia && <p className="text-danger">{errors.porcentajeFondoContingencia.message}</p>}
          </div>
        </div>

        <hr className="my-4" />

        <h5>Logo del Condominio</h5>
        <div className="mb-3">
          <label htmlFor="logo" className="form-label">Subir nuevo logo</label>
          <input type="file" {...register('logo')} className="form-control" accept="image/png, image/jpeg" />
        </div>

        <div className="mb-3">
          <p>Vista Previa:</p>
          {logoPreview ? (
            <Image src={logoPreview} alt="Vista previa del logo" width={150} height={150} style={{ objectFit: 'contain' }} />
          ) : (
            <p className="text-muted">No hay logo cargado.</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
}
