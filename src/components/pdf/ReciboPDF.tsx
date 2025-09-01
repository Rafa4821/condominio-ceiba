'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Condominio, Recibo, PeriodoCobro } from '@/types';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#4A90E2', paddingBottom: 10 },
  headerInfo: { textAlign: 'right' },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A90E2' },
  headerText: { fontSize: 9, marginTop: 2 },
  logo: { width: 80, height: 80 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#F0F0F0', padding: 5, marginBottom: 10, color: '#4A90E2' },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCol: { width: '48%' },
  table: { display: 'flex', width: 'auto' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EAEAEA', paddingVertical: 4 },
  tableColHeader: { width: '70%', fontWeight: 'bold' },
  tableCol: { width: '70%' },
  tableCellHeader: { textAlign: 'right', width: '30%', fontWeight: 'bold' },
  tableCell: { textAlign: 'right', width: '30%' },
  summaryBox: { backgroundColor: '#F8F8F8', padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#EAEAEA' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontWeight: 'bold' },
  summaryTotal: { fontWeight: 'bold', fontSize: 12, color: '#4A90E2' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: 'grey' },
  textRight: { textAlign: 'right' },
  bold: { fontWeight: 'bold' },
});

const formatCurrency = (value: number) => `$${(value || 0).toFixed(2)}`;

interface ReciboPDFProps {
  recibo: Recibo;
  condominio: Condominio;
  periodo: PeriodoCobro;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const ReciboPDF: React.FC<ReciboPDFProps> = ({ recibo, condominio, periodo }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          {/* <Image style={styles.logo} src="/logo.png" /> Reemplazar con la ruta a tu logo */}
          <Text style={styles.headerTitle}>{condominio.nombre}</Text>
          <Text style={styles.headerText}>{condominio.direccion}</Text>
          <Text style={styles.headerText}>RIF: {condominio.rif}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>RECIBO DE CONDOMINIO</Text>
          <Text style={styles.headerText}>Período: {MESES[periodo.mes - 1]} {periodo.ano}</Text>
          <Text style={styles.headerText}>Fecha Emisión: {new Date(recibo.fechaEmision.seconds * 1000).toLocaleDateString()}</Text>
          <Text style={styles.headerText}>Recibo N°: {recibo.id.substring(0, 7)}</Text>
        </View>
      </View>

      {/* Información del Propietario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Propietario</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Propietario:</Text>
            <Text style={styles.bold}>{recibo.inmuebleInfo.propietario}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Inmueble:</Text>
            <Text style={styles.bold}>{recibo.inmuebleInfo.identificador}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Alícuota:</Text>
            <Text style={styles.bold}>{recibo.inmuebleInfo.alicuota.toFixed(4)}%</Text>
          </View>
        </View>
      </View>

      {/* Desglose y Resumen */}
      <View style={[styles.grid, styles.section]}>
        {/* Columna Izquierda: Relación de Gastos */}
        <View style={styles.gridCol}>
          <Text style={styles.sectionTitle}>Relación de Gastos Comunes</Text>
          <View style={styles.table}>
            {recibo.detalleGastosComunes.map((gasto, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.tableCol}>{gasto.descripcion}</Text>
                <Text style={styles.tableCell}>{formatCurrency(gasto.cuotaParte)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Columna Derecha: Resumen de Cuotas */}
        <View style={styles.gridCol}>
          <Text style={styles.sectionTitle}>Resumen de Cuotas</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text>Total Gastos Comunes:</Text>
              <Text>{formatCurrency(recibo.cuotaParteGastosComunes)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Fondo de Reserva:</Text>
              <Text>{formatCurrency(recibo.cuotaParteFondoReserva)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Fondo de Contingencia:</Text>
              <Text>{formatCurrency(recibo.cuotaParteFondoContingencia)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Fondo de Estabilización:</Text>
              <Text>{formatCurrency(recibo.cuotaParteFondoEstabilizacion)}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#EAEAEA', paddingTop: 5 }]}>
              <Text style={styles.summaryLabel}>Sub-Total del Mes:</Text>
              <Text style={styles.summaryLabel}>{formatCurrency(recibo.subtotalMes)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Saldo Anterior:</Text>
              <Text style={{ color: recibo.saldoAnterior < 0 ? 'green' : 'red' }}>{formatCurrency(recibo.saldoAnterior)}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#4A90E2', paddingTop: 5 }]}>
              <Text style={styles.summaryTotal}>TOTAL A PAGAR:</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(recibo.totalAPagar)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pie de Página */}
      <View style={styles.footer}>
        <Text style={styles.bold}>Datos para el Pago</Text>
        <Text>{condominio.datosBancarios}</Text>
        <Text style={{ marginTop: 5 }}>Para confirmar su pago, por favor envíe el comprobante a la administración. Este documento es un aviso de cobro y no un comprobante de pago.</Text>
      </View>
    </Page>
  </Document>
);
