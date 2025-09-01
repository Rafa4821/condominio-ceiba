'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Inmueble, Recibo, Condominio, PeriodoCobro } from '@/types';
import { Modal } from 'react-bootstrap';
import { PDFViewer } from '@react-pdf/renderer';
import { ReciboPDF } from '@/components/pdf/ReciboPDF';

const MisRecibosPage = () => {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [selectedInmueble, setSelectedInmueble] = useState<Inmueble | null>(null);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [periodos, setPeriodos] = useState<Record<string, PeriodoCobro>>({});
  const [loading, setLoading] = useState(true);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfData, setPdfData] = useState<{ recibo: Recibo; condominio: Condominio; periodo: PeriodoCobro } | null>(null);

  useEffect(() => {
    const fetchInmuebles = async () => {
      const inmueblesCollection = collection(db, 'inmuebles');
      const snapshot = await getDocs(inmueblesCollection);
      const inmueblesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inmueble));
      setInmuebles(inmueblesList);
      setLoading(false);
    };
    fetchInmuebles();
  }, []);

  useEffect(() => {
    if (!selectedInmueble) return;

    const fetchRecibos = async () => {
      setLoading(true);
      const recibosQuery = query(collection(db, 'recibos'), where('inmuebleId', '==', selectedInmueble.id));
      const snapshot = await getDocs(recibosQuery);
      const recibosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recibo));
      setRecibos(recibosList);

      // Cargar los períodos asociados para tener la información del mes/año
      const periodosIds = [...new Set(recibosList.map(r => r.periodoId))];
      const periodosData: Record<string, PeriodoCobro> = {};
      for (const id of periodosIds) {
        const periodoDoc = await getDoc(doc(db, 'periodosCobro', id));
        if (periodoDoc.exists()) {
          periodosData[id] = { id: periodoDoc.id, ...periodoDoc.data() } as PeriodoCobro;
        }
      }
      setPeriodos(periodosData);
      setLoading(false);
    };

    fetchRecibos();
  }, [selectedInmueble]);

  const handleViewPdf = async (recibo: Recibo) => {
    if (!periodos[recibo.periodoId]) return;

    try {
      const condominioRef = doc(db, 'condominio', 'main');
      const condominioSnap = await getDoc(condominioRef);
      if (!condominioSnap.exists()) throw new Error('Datos del condominio no encontrados');
      const condominio = condominioSnap.data() as Condominio;

      setPdfData({
        recibo,
        condominio,
        periodo: periodos[recibo.periodoId],
      });

      setShowPdfModal(true);
    } catch (error) {
      console.error('Error preparando datos para PDF:', error);
      alert('No se pudieron cargar los datos para generar el PDF.');
    }
  };

  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <>
      <div className="container-fluid">
        <h2>Mis Recibos</h2>
        <p>Seleccione un inmueble para ver su historial de recibos.</p>

        <div className="row">
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">Inmuebles</div>
              <ul className="list-group list-group-flush">
                {inmuebles.map(inmueble => (
                  <li 
                    key={inmueble.id} 
                    className={`list-group-item list-group-item-action ${selectedInmueble?.id === inmueble.id ? 'active' : ''}`}
                    onClick={() => setSelectedInmueble(inmueble)}
                    style={{ cursor: 'pointer' }}
                  >
                    {inmueble.identificador} - {inmueble.propietario.nombre}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                {selectedInmueble ? `Historial de Recibos para ${selectedInmueble.identificador}` : 'Seleccione un Inmueble'}
              </div>
              <div className="card-body">
                {loading && <p>Cargando...</p>}
                {!loading && !selectedInmueble && <p>No ha seleccionado ningún inmueble.</p>}
                {!loading && selectedInmueble && recibos.length === 0 && <p>No hay recibos para este inmueble.</p>}
                {!loading && recibos.length > 0 && (
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th className="text-end">Monto (USD)</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recibos.map(recibo => {
                        const periodo = periodos[recibo.periodoId];
                        return (
                          <tr key={recibo.id}>
                            <td>{periodo ? `${MESES[periodo.mes - 1]} ${periodo.ano}` : 'Cargando...' }</td>
                            <td className="text-end">${recibo.totalAPagar.toFixed(2)}</td>
                            <td className="text-center">
                              <button onClick={() => handleViewPdf(recibo)} className="btn btn-sm btn-secondary">Ver PDF</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
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
};

export default MisRecibosPage;
