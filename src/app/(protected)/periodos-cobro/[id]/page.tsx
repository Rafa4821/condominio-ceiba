'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { PDFViewer } from '@react-pdf/renderer';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDocs, collection, writeBatch, serverTimestamp, query, where, getDoc, FieldValue } from 'firebase/firestore';
import { useForm, SubmitHandler } from 'react-hook-form';
import { db } from '@/lib/firebase';
import { PeriodoCobro, Gasto, Inmueble, Recibo, Condominio, ConceptoGasto } from '@/types';
import { ReciboPDF } from '@/components/pdf/ReciboPDF';


interface GastoForm {
  conceptoId: string;
  monto: number;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function PeriodoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [periodo, setPeriodo] = useState<PeriodoCobro | null>(null);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfData, setPdfData] = useState<{ recibo: Recibo; condominio: Condominio; periodo: PeriodoCobro; } | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<GastoForm>();

  // Cargar conceptos de gasto y el período actual
  useEffect(() => {
    if (!id) return;

    const fetchConceptos = async () => {
      const conceptosCollection = collection(db, 'conceptosGasto');
      const snapshot = await getDocs(conceptosCollection);
      const conceptosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConceptoGasto));
      setConceptos(conceptosList);
    };

    fetchConceptos();

    const periodoDoc = doc(db, 'periodosCobro', id);
    const unsubscribe = onSnapshot(periodoDoc, async (doc) => {
      if (doc.exists()) {
        const periodoData = { id: doc.id, ...doc.data() } as PeriodoCobro;
        setPeriodo(periodoData);

        if (periodoData.estado === 'publicado') {
          const recibosQuery = query(collection(db, 'recibos'), where('periodoId', '==', id));
          const recibosSnapshot = await getDocs(recibosQuery);
          const recibosList = recibosSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recibo));
          setRecibos(recibosList);
        }

      } else {
        router.push('/periodos-cobro'); // Si no existe, volver
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, router]);

  const handleAddGasto: SubmitHandler<GastoForm> = async (data) => {
    if (!periodo) return;

    const conceptoSeleccionado = conceptos.find(c => c.id === data.conceptoId);
    if (!conceptoSeleccionado) return;

    const nuevoGasto: Gasto = {
      id: `${Date.now()}`,
      descripcion: conceptoSeleccionado.descripcion,
      categoria: conceptoSeleccionado.categoria,
      monto: Number(data.monto),
    };

    const periodoRef = doc(db, 'periodosCobro', id);

    const updates: { [key: string]: FieldValue | number } = { 
      gastos: arrayUnion(nuevoGasto),
      totalGastosComunes: (periodo.totalGastosComunes || 0) + nuevoGasto.monto
    };

    await updateDoc(periodoRef, updates);

    reset();
  };

  const handleRemoveGasto = async (gastoToRemove: Gasto) => {
    if (!periodo || !window.confirm(`¿Seguro que quieres eliminar el gasto "${gastoToRemove.descripcion}"?`)) return;

    const periodoRef = doc(db, 'periodosCobro', id);

    const updates: { [key: string]: FieldValue | number } = { 
      gastos: arrayRemove(gastoToRemove),
      totalGastosComunes: (periodo.totalGastosComunes || 0) - gastoToRemove.monto
    };

    await updateDoc(periodoRef, updates);
  };

  const handleFinalizar = async () => {
    if (!periodo || !window.confirm('¿Está seguro de que desea finalizar el registro de gastos y generar los recibos? Esta acción no se puede deshacer.')) return;

    try {
      const inmueblesCollection = collection(db, 'inmuebles');
      const inmueblesSnapshot = await getDocs(inmueblesCollection);
      const inmuebles = inmueblesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inmueble));

      // Calcular fondos automáticamente
      const fondoReservaCalculado = (periodo.totalGastosComunes || 0) * 0.10;
      const fondoContingenciaCalculado = (periodo.totalGastosComunes || 0) * 0.235;

      const batch = writeBatch(db);
      const recibosCollection = collection(db, 'recibos');

      for (const inmueble of inmuebles) {
        const alicuota = inmueble.alicuota / 100;
        
        const cuotaParteGastosComunes = (periodo.totalGastosComunes || 0) * alicuota;
        const cuotaParteFondoReserva = fondoReservaCalculado * alicuota;
        const cuotaParteFondoContingencia = fondoContingenciaCalculado * alicuota;

        const detalleGastosComunes = periodo.gastos
          .map(gasto => ({
            descripcion: gasto.descripcion,
            montoTotalGasto: gasto.monto,
            cuotaParte: gasto.monto * alicuota,
          }));

        const subtotalMes = cuotaParteGastosComunes + cuotaParteFondoReserva + cuotaParteFondoContingencia;
        const totalAPagar = subtotalMes + inmueble.saldoAnterior;

        const nuevoRecibo: Omit<Recibo, 'id' | 'fechaEmision'> & { fechaEmision: FieldValue } = {
          periodoId: periodo.id,
          inmuebleId: inmueble.id,
          inmuebleInfo: {
            identificador: inmueble.identificador,
            propietario: inmueble.propietario.nombre,
            alicuota: inmueble.alicuota,
          },
          detalleGastosComunes,
          cuotaParteGastosComunes,
          cuotaParteFondoReserva,
          cuotaParteFondoContingencia,
          subtotalMes,
          saldoAnterior: inmueble.saldoAnterior,
          totalAPagar,
          estado: 'pendiente',
          fechaEmision: serverTimestamp(),
        };

        const reciboRef = doc(recibosCollection);
        batch.set(reciboRef, nuevoRecibo);
      }

      const periodoRef = doc(db, 'periodosCobro', id);
      batch.update(periodoRef, { 
        estado: 'publicado',
        fondoReserva: fondoReservaCalculado,
        fondoContingencia: fondoContingenciaCalculado
      });

      await batch.commit();

      alert('¡Recibos generados exitosamente!');
      router.push(`/periodos-cobro`);

    } catch (error) {
      console.error('Error al generar los recibos:', error);
      alert('Hubo un error al generar los recibos.');
    }
  };

  if (loading) return <p>Cargando período...</p>;
  if (!periodo) return <p>No se encontró el período.</p>;

  const handleViewPdf = async (receiptId: string) => {
    const reciboSeleccionado = recibos.find(r => r.id === receiptId);
    if (!reciboSeleccionado || !periodo) return;

    try {
      // Obtener datos del condominio
      const condominioRef = doc(db, 'condominio', 'main');
      const condominioSnap = await getDoc(condominioRef);
      if (!condominioSnap.exists()) throw new Error('Datos del condominio no encontrados');
      const condominio = condominioSnap.data() as Condominio;

      setPdfData({
        recibo: reciboSeleccionado,
        condominio: condominio,
        periodo: periodo,
      });

      setShowPdfModal(true);

    } catch (error) {
      console.error('Error preparando datos para PDF:', error);
      alert('No se pudieron cargar los datos para generar el PDF.');
    }
  };

  const handleSendEmail = async (receiptId: string) => {
    setSendingEmailId(receiptId);
    try {
      const response = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiptId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error desconocido al enviar el correo');
      }

      alert('¡Correo enviado exitosamente!');

    } catch (error) {
      console.error('Error al enviar el correo:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Ocurrió un error desconocido al enviar el correo');
      }
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!id || !window.confirm('¿Está seguro de que desea enviar todos los recibos por correo? Esta acción puede tardar unos minutos.')) return;

    setIsSendingBulk(true);
    try {
      const response = await fetch('/api/send-bulk-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ periodoId: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error desconocido al enviar los correos.');
      }

      alert(result.message || '¡Los correos se han puesto en cola para su envío!');

    } catch (error) {
      console.error('Error en el envío masivo:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Ocurrió un error desconocido durante el envío masivo.');
      }
    } finally {
      setIsSendingBulk(false);
    }
  };

  return (
    <>
      <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{periodo.estado === 'borrador' ? 'Registro de Gastos para:' : 'Detalle del Período:'} {MESES[periodo.mes - 1]} {periodo.ano}</h2>
        {periodo.estado === 'borrador' && (
          <button onClick={handleFinalizar} className="btn btn-success">Finalizar y Generar Recibos</button>
        )}
      </div>

      {periodo.estado === 'borrador' ? (
        <>
          {/* Formulario para agregar gastos */}
          <div className="card mb-4">
            <div className="card-header">Agregar Gasto</div>
            <div className="card-body">
              <form onSubmit={handleSubmit(handleAddGasto)} className="row g-3 align-items-end">
                <div className="col-md-6">
                  <label htmlFor="conceptoId" className="form-label">Concepto</label>
                  <select {...register('conceptoId', { required: true })} className="form-select">
                    <option value="">-- Seleccione un concepto --</option>
                    {conceptos.map(c => <option key={c.id} value={c.id}>{c.descripcion} ({c.categoria})</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="monto" className="form-label">Monto (USD)</label>
                  <input type="number" {...register('monto', { required: true, min: 0.01 })} step="0.01" className="form-control" />
                </div>
                <div className="col-md-2">
                  <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>Agregar</button>
                </div>
              </form>
            </div>
          </div>

          {/* Lista de gastos registrados */}
          <div className="card">
            <div className="card-header d-flex justify-content-between">
              <span>Gastos Registrados ({periodo.gastos.length})</span>
              <div className="text-end">
                <strong>Total Gastos Comunes: ${(periodo.totalGastosComunes || 0).toFixed(2)}</strong><br />
                <small>Fondo de Reserva (10%): ${((periodo.totalGastosComunes || 0) * 0.10).toFixed(2)}</small><br />
                <small>Fondo de Contingencia (23.5%): ${((periodo.totalGastosComunes || 0) * 0.235).toFixed(2)}</small>
              </div>
            </div>
            <div className="card-body p-0">
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th className="text-end">Monto (USD)</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {periodo.gastos.map((gasto) => (
                    <tr key={gasto.id}>
                      <td>{gasto.descripcion}</td>
                      <td>{gasto.categoria}</td>
                      <td className="text-end">${gasto.monto.toFixed(2)}</td>
                      <td className="text-center">
                        <button onClick={() => handleRemoveGasto(gasto)} className="btn btn-sm btn-danger">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {periodo.gastos.length === 0 && (
                    <tr><td colSpan={4} className="text-center p-3">Aún no hay gastos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>Recibos Generados ({recibos.length})</span>
            <button 
              onClick={handleSendBulkEmail} 
              className="btn btn-primary"
              disabled={isSendingBulk}
            >
              {isSendingBulk ? 'Enviando...' : 'Enviar Todos por Correo'}
            </button>
          </div>
          <div className="card-body p-0">
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Inmueble</th>
                  <th>Propietario</th>
                  <th className="text-end">Total a Pagar (USD)</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recibos.map(recibo => (
                  <tr key={recibo.id}>
                    <td>{recibo.inmuebleInfo.identificador}</td>
                    <td>{recibo.inmuebleInfo.propietario}</td>
                    <td className="text-end">${recibo.totalAPagar.toFixed(2)}</td>
                    <td className="text-center">
                      <button onClick={() => handleViewPdf(recibo.id)} className="btn btn-sm btn-secondary me-2">Ver PDF</button>
                      <button 
                        onClick={() => handleSendEmail(recibo.id)} 
                        className="btn btn-sm btn-info"
                        disabled={sendingEmailId === recibo.id}
                      >
                        {sendingEmailId === recibo.id ? 'Enviando...' : 'Enviar por Email'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    <Modal show={showPdfModal} onHide={() => setShowPdfModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Recibo de Condominio</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh' }}>
          {pdfData && (
            <PDFViewer width="100%" height="100%">
              <ReciboPDF 
                recibo={pdfData.recibo} 
                condominio={pdfData.condominio} 
                periodo={pdfData.periodo} 
              />
            </PDFViewer>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
