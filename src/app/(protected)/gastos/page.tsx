'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, QuerySnapshot, DocumentData, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { ConceptoGasto } from '@/types';

export default function ConceptosGastoPage() {
  const [conceptos, setConceptos] = useState<ConceptoGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const conceptosCollection = collection(db, 'conceptosGasto');
    const unsubscribe = onSnapshot(conceptosCollection, (snapshot: QuerySnapshot<DocumentData>) => {
      const conceptosList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ConceptoGasto));
      setConceptos(conceptosList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filteredIds = conceptos
      .filter(c => 
        c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(c => c.id);

    if (e.target.checked) {
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    } else {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este concepto?')) {
      await deleteDoc(doc(db, 'conceptosGasto', id));
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`¿Está seguro de que desea eliminar ${selectedIds.length} concepto(s)?`)) {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'conceptosGasto', id));
      });
      await batch.commit();
      setSelectedIds([]);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Conceptos de Gasto</h1>
        <Link href="/gastos/nuevo" className="btn btn-primary">
          Agregar Concepto
        </Link>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <input 
          type="text"
          className="form-control w-50"
          placeholder="Buscar por descripción o categoría..."
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
        <p>Cargando conceptos...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th><input type="checkbox" className="form-check-input" onChange={handleSelectAll} /></th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conceptos
              .filter(c => 
                c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(concepto => (
              <tr key={concepto.id} className={selectedIds.includes(concepto.id) ? 'table-active' : ''}>
                <td><input type="checkbox" className="form-check-input me-3" checked={selectedIds.includes(concepto.id)} onChange={() => handleSelectOne(concepto.id)} />{concepto.descripcion}</td>
                <td>{concepto.categoria}</td>
                <td>
                  <Link href={`/gastos/editar/${concepto.id}`} className="btn btn-sm btn-secondary me-2">Editar</Link>
                  <button onClick={() => handleDelete(concepto.id)} className="btn btn-sm btn-danger">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
