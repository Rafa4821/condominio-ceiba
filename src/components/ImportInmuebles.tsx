'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Inmueble } from '@/types';

interface InmuebleRow {
  identificador: string;
  propietario_nombre: string;
  propietario_email: string;
  alicuota: string | number;
  saldo_anterior: string | number;
}

interface ImportInmueblesProps {
  onInmueblesImported: (inmuebles: Omit<Inmueble, 'id'>[]) => void;
}

export const ImportInmuebles: React.FC<ImportInmueblesProps> = ({ onInmueblesImported }) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      let data: InmuebleRow[] = [];
      if (file.name.endsWith('.xlsx')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json<InmuebleRow>(worksheet);
      } else if (file.name.endsWith('.csv')) {
        data = await new Promise<InmuebleRow[]>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            // Limpia los encabezados de espacios y del carácter BOM
            transformHeader: header => header.trim().replace(/^\uFEFF/, ''),
            complete: (results) => resolve(results.data as InmuebleRow[]),
            error: (error) => reject(error),
          });
        });
      }

      const inmuebles = data.map((row: InmuebleRow) => ({
        identificador: row.identificador || '',
        propietario: {
          nombre: row.propietario_nombre || '',
          email: row.propietario_email || '',
        },
        alicuota: parseFloat(String(row.alicuota)) || 0,
        saldoAnterior: parseFloat(String(row.saldo_anterior)) || 0,
      }));

      if (inmuebles.length > 0) {
        onInmueblesImported(inmuebles);
      } else {
        alert('No se encontraron datos válidos en el archivo. Asegúrese de que las columnas sean: identificador, propietario_nombre, propietario_email, alicuota, saldo_anterior.');
      }

    } catch (error) {
      console.error('Error al importar el archivo:', error);
      alert('Ocurrió un error al procesar el archivo.');
    } finally {
      setIsImporting(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="d-flex flex-column align-items-start">
      <div className="d-flex">
        <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="d-none"
        accept=".xlsx, .csv"
      />
      <button onClick={triggerFileInput} className="btn btn-success ms-2" disabled={isImporting}>
        {isImporting ? 'Importando...' : 'Importar desde Archivo'}
        </button>
      </div>
      <a href="/plantilla_inmuebles.csv" download className="form-text mt-2" style={{ fontSize: '0.8rem' }}>
        Descargar plantilla de ejemplo (.csv)
      </a>
    </div>
  );
};
