'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where, writeBatch, addDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Concept, Unit, ReceiptItem } from '@/types';
import { generarRecibos, calcularTotalRecibo } from '@/lib/calculo';
import { useRouter } from 'next/navigation';

// Mock buildingId - esto debería venir del contexto de usuario
const BUILDING_ID = 'mock-building-1';

// Placeholder para los componentes de cada paso
const Step1Periodo = ({ onComplete }: { onComplete: (periodo: string) => void }) => (
  <div className="card p-4">
    <h5>Paso 1: Seleccionar Período</h5>
    <p>Elige el mes y año para la liquidación.</p>
    <input type="month" className="form-control" onChange={(e) => onComplete(e.target.value)} />
  </div>
);
const Step2Conceptos = ({ conceptos, onConceptosChange }: { conceptos: Concept[], onConceptosChange: (conceptos: Concept[]) => void }) => {
  const [localConceptos, setLocalConceptos] = useState(conceptos);

  const handleMontoChange = (conceptoId: string, nuevoMonto: string) => {
    const updatedConceptos = localConceptos.map(c => {
      if (c.id === conceptoId) {
        return { ...c, monto: parseFloat(nuevoMonto) || 0 };
      }
      return c;
    });
    setLocalConceptos(updatedConceptos);
    onConceptosChange(updatedConceptos);
  };

  return (
    <div className="card p-4">
      <h5>Paso 2: Revisar y Ajustar Conceptos</h5>
      <p className="text-muted">Ajusta los montos para los conceptos de tipo 'prorrateo' que varían cada mes (ej: cuentas de luz, agua).</p>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Método</th>
            <th>Monto / Tarifa</th>
          </tr>
        </thead>
        <tbody>
          {localConceptos.map(c => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.metodo}</td>
              <td>
                {c.metodo === 'prorrateo' ? (
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input 
                      type="number"
                      className="form-control"
                      value={c.monto || ''}
                      onChange={(e) => handleMontoChange(c.id, e.target.value)}
                    />
                  </div>
                ) : (
                  `$${c.monto || c.tarifa}`
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
const Step3Unidades = ({ unidades }: { unidades: Unit[] }) => (
  <div className="card p-4">
    <h5>Paso 3: Revisar Unidades Incluidas</h5>
    <p className="text-muted">Estas son las unidades activas que se incluirán en la liquidación. Por ahora, no se pueden excluir unidades.</p>
    <ul className="list-group">
      {unidades.map(u => (
        <li key={u.id} className="list-group-item d-flex justify-content-between align-items-center">
          {u.nombre}
          <span className="badge bg-success rounded-pill">Activa</span>
        </li>
      ))}
    </ul>
  </div>
);
const Step4Resumen = ({ conceptos, unidades }: { conceptos: Concept[], unidades: Unit[] }) => {
  const recibosMap = useMemo(() => {
    if (conceptos.length === 0 || unidades.length === 0) return new Map<string, ReceiptItem[]>();
    return generarRecibos(conceptos, unidades);
  }, [conceptos, unidades]);

  const totalGeneral = useMemo(() => {
    let total = 0;
    recibosMap.forEach(items => {
      total += calcularTotalRecibo(items);
    });
    return total;
  }, [recibosMap]);

  if (recibosMap.size === 0) {
    return <div className="card p-4"><h5>Paso 4: Resumen y Confirmación</h5><p>No hay datos suficientes para generar los recibos.</p></div>;
  }

  return (
    <div className="card p-4">
      <h5>Paso 4: Resumen y Confirmación</h5>
      <p>Se generarán {recibosMap.size} recibos. Revisa los totales antes de confirmar.</p>
      <table className="table">
        <thead>
          <tr>
            <th>Unidad</th>
            <th className="text-end">Total Recibo</th>
          </tr>
        </thead>
        <tbody>
          {unidades.map(u => {
            const items = recibosMap.get(u.id) || [];
            const totalUnidad = calcularTotalRecibo(items);
            return (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td className="text-end">${totalUnidad.toLocaleString('es-CL')}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="fw-bold">
            <td>Total General</td>
            <td className="text-end">${totalGeneral.toLocaleString('es-CL')}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default function NuevaLiquidacionPage() {
  const [step, setStep] = useState(1);
  const [periodo, setPeriodo] = useState(''); // YYYY-MM
  const [conceptosMes, setConceptosMes] = useState<Concept[]>([]);

  const { data: conceptosDb, isLoading: isLoadingConceptos } = useQuery<Concept[]>({
    queryKey: ['concepts', BUILDING_ID],
    queryFn: async () => {
      const q = query(collection(db, 'concepts'), where('buildingId', '==', BUILDING_ID), where('activo', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Concept[];
    },
    enabled: step >= 2, // Solo cargar cuando llegamos al paso 2
  });

  const { data: unidadesDb, isLoading: isLoadingUnidades } = useQuery<Unit[]>({
    queryKey: ['units', BUILDING_ID],
    queryFn: async () => {
      const q = query(collection(db, 'units'), where('buildingId', '==', BUILDING_ID), where('activo', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[];
    },
    enabled: step >= 3, // Solo cargar cuando llegamos al paso 3
  });

  // Cuando los conceptos de la BD cargan, los ponemos en el estado del wizard
  useEffect(() => {
    if (conceptosDb) {
      setConceptosMes(conceptosDb);
    }
  }, [conceptosDb]);

  const router = useRouter();
  const queryClient = useQueryClient();

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const createSettlementMutation = useMutation({
    mutationFn: async () => {
      if (!periodo || conceptosMes.length === 0 || !unidadesDb || unidadesDb.length === 0) {
        throw new Error('Faltan datos para generar la liquidación.');
      }

      const recibosMap = generarRecibos(conceptosMes, unidadesDb);
      const totalLiquidacion = Array.from(recibosMap.values()).reduce((sum, items) => sum + calcularTotalRecibo(items), 0);

      // 1. Crear el documento de la liquidación
      const settlementRef = await addDoc(collection(db, 'settlements'), {
        buildingId: BUILDING_ID,
        periodo: periodo,
        createdAt: Timestamp.now(),
        total: totalLiquidacion,
        status: 'abierta'
      });

      // 2. Crear todos los recibos en un batch
      const batch = writeBatch(db);
      recibosMap.forEach((items, unitId) => {
        const unitData = unidadesDb.find(u => u.id === unitId);
        if (unitData) {
          const receiptRef = doc(collection(db, 'receipts'));
          batch.set(receiptRef, {
            settlementId: settlementRef.id,
            unitId: unitId,
            buildingId: BUILDING_ID,
            unitName: unitData.nombre,
            periodo: periodo,
            items: items,
            total: calcularTotalRecibo(items),
            status: 'pendiente', // pendiente, pagado
            createdAt: Timestamp.now(),
          });
        }
      });

      await batch.commit();
      return settlementRef.id;
    },
    onSuccess: (settlementId) => {
      alert('Liquidación generada con éxito!');
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      router.push(`/liquidaciones/${settlementId}`);
    },
    onError: (error) => {
      alert(`Error al generar la liquidación: ${error.message}`);
    }
  });

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Periodo onComplete={setPeriodo} />;
      case 2:
        if (isLoadingConceptos) return <div>Cargando conceptos...</div>;
        return <Step2Conceptos conceptos={conceptosMes} onConceptosChange={setConceptosMes} />;
      case 3:
        if (isLoadingUnidades) return <div>Cargando unidades...</div>;
        return <Step3Unidades unidades={unidadesDb || []} />;
      case 4:
        return <Step4Resumen conceptos={conceptosMes} unidades={unidadesDb || []} />;
      default:
        return <Step1Periodo onComplete={setPeriodo} />;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Crear Nueva Liquidación</h1>
      </div>

      <div className="progress mb-4" style={{ height: '25px' }}>
        <div 
          className="progress-bar bg-success"
          role="progressbar" 
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        >
          Paso {step} de 4
        </div>
      </div>

      <div className="my-4">
        {renderStep()}
      </div>

      <div className="mt-4 d-flex justify-content-between">
        <button className="btn btn-secondary" onClick={handleBack} disabled={step === 1}>
          Atrás
        </button>
                {step < 4 ? (
          <button className="btn btn-primary" onClick={handleNext}>
            Siguiente
          </button>
        ) : (
          <button 
            className="btn btn-success" 
            onClick={() => createSettlementMutation.mutate()}
            disabled={createSettlementMutation.isPending}
          >
            {createSettlementMutation.isPending ? 'Generando...' : 'Generar Liquidación'}
          </button>
        )}
      </div>
    </div>
  );
}
