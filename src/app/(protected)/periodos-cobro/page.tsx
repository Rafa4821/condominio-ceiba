'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, QuerySnapshot, DocumentData, doc, deleteDoc } from 'firebase/firestore';
import { Dropdown } from 'react-bootstrap';
import { db } from '@/lib/firebase';
import { PeriodoCobro } from '@/types';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function PeriodosCobroPage() {
  const [periodos, setPeriodos] = useState<PeriodoCobro[]>([]);
  const [filteredPeriodos, setFilteredPeriodos] = useState<PeriodoCobro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const periodosCollection = collection(db, 'periodosCobro');
    const unsubscribe = onSnapshot(periodosCollection, (snapshot: QuerySnapshot<DocumentData>) => {
      const periodosList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as PeriodoCobro));
            const sortedList = periodosList.sort((a, b) => b.ano - a.ano || b.mes - a.mes);
      setPeriodos(sortedList);
      setFilteredPeriodos(sortedList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const results = periodos.filter(p => 
      `${MESES[p.mes - 1]} ${p.ano}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPeriodos(results);
  }, [searchTerm, periodos]);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este período? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(db, 'periodosCobro', id));
        alert('Período eliminado con éxito.');
      } catch (error) {
        console.error('Error al eliminar el período:', error);
        alert('Hubo un error al eliminar el período.');
      }
    }
  };

  const getStatusBadge = (status: 'borrador' | 'publicado') => {
    switch (status) {
      case 'borrador':
        return 'badge bg-secondary';
      case 'publicado':
        return 'badge bg-success';
      default:
        return 'badge bg-light text-dark';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Períodos de Cobro</h1>
        <Link href="/periodos-cobro/nuevo" className="btn btn-primary">
          Crear Nuevo Período
        </Link>
      </div>

      <div className="mb-3">
        <input 
          type="text"
          className="form-control"
          placeholder="Buscar por mes o año..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loading ? (
        <p>Cargando períodos...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Período</th>
              <th>Fecha de Creación</th>
              <th>Total Gastos Comunes (USD)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeriodos.map(periodo => (
              <tr key={periodo.id}>
                <td>{`${MESES[periodo.mes - 1]} ${periodo.ano}`}</td>
                <td>{periodo.fechaCreacion.toDate().toLocaleDateString()}</td>
                <td>${periodo.totalGastosComunes.toFixed(2)}</td>
                <td>
                  <span className={getStatusBadge(periodo.estado)}>{periodo.estado}</span>
                </td>
                <td>
                  <Dropdown>
                    <Dropdown.Toggle variant="secondary" size="sm" id={`dropdown-${periodo.id}`}>
                      Acciones
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} href={`/periodos-cobro/${periodo.id}`}>Ver / Gestionar</Dropdown.Item>
                      {periodo.estado === 'borrador' && (
                        <>
                          <Dropdown.Item as={Link} href={`/periodos-cobro/editar/${periodo.id}`}>Editar</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDelete(periodo.id)} className="text-danger">Eliminar</Dropdown.Item>
                        </>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
