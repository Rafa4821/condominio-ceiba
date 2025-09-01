'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, QuerySnapshot, DocumentData, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Inmueble } from '@/types';

export default function InmueblesPage() {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const totalAlicuota = inmuebles.reduce((sum, current) => sum + (current.alicuota || 0), 0);

  useEffect(() => {
    const inmueblesCollection = collection(db, 'inmuebles');
    const unsubscribe = onSnapshot(inmueblesCollection, (snapshot: QuerySnapshot<DocumentData>) => {
      const inmueblesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Inmueble));
      setInmuebles(inmueblesList);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(inmuebles.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`¿Está seguro de que desea eliminar ${selectedIds.length} inmueble(s)?`)) {
      try {
        const batch = writeBatch(db);
        selectedIds.forEach(id => {
          const docRef = doc(db, 'inmuebles', id);
          batch.delete(docRef);
        });
        await batch.commit();
        setSelectedIds([]); // Limpiar selección
      } catch (error) {
        console.error("Error eliminando inmuebles: ", error);
        alert('Hubo un error al eliminar los inmuebles seleccionados.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este inmueble? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(db, 'inmuebles', id));
        // El UI se actualizará automáticamente gracias a onSnapshot
      } catch (error) {
        console.error("Error eliminando el inmueble: ", error);
        alert('Hubo un error al eliminar el inmueble.');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Inmuebles</h1>
        <Link href="/inmuebles/nuevo" className="btn btn-primary">
          Agregar Inmueble
        </Link>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <input 
          type="text"
          className="form-control w-50"
          placeholder="Buscar por identificador, propietario..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {selectedIds.length > 0 && (
          <button onClick={handleDeleteSelected} className="btn btn-danger">
            Eliminar ({selectedIds.length}) seleccionados
          </button>
        )}
      </div>
      
      {loading ? (
        <p>Cargando inmuebles...</p>
      ) : (
        <>
          <div className={`alert ${totalAlicuota.toFixed(3) === '100.000' ? 'alert-success' : 'alert-warning'}`}>
            <strong>Suma de Alícuotas:</strong> {totalAlicuota.toFixed(3)}%
            {totalAlicuota.toFixed(3) !== '100.000' && (
              <span className="ms-3 fw-bold">
                ¡Atención! La suma debe ser exactamente 100%.
              </span>
            )}
          </div>
        </>
      )}

      {loading ? (
        <p>Cargando inmuebles...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  className="form-check-input"
                  onChange={handleSelectAll}
                  checked={selectedIds.length > 0 && selectedIds.length === inmuebles.length}
                />
              </th>
              <th>Identificador</th>
              <th>Propietario</th>
              <th>Email</th>
              <th>Alícuota (%)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inmuebles
              .filter(inmueble => 
                inmueble.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inmueble.propietario.nombre.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(inmueble => (
              <tr key={inmueble.id} className={selectedIds.includes(inmueble.id) ? 'table-active' : ''}>
                <td>
                  <input 
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.includes(inmueble.id)}
                    onChange={() => handleSelectOne(inmueble.id)}
                  />
                </td>
                <td>{inmueble.identificador}</td>
                <td>{inmueble.propietario.nombre}</td>
                <td>{inmueble.propietario.email}</td>
                <td>{inmueble.alicuota}</td>
                <td>
                  <Link href={`/inmuebles/editar/${inmueble.id}`} className="btn btn-sm btn-secondary me-2">Editar</Link>
                  <button onClick={() => handleDelete(inmueble.id)} className="btn btn-sm btn-danger">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
