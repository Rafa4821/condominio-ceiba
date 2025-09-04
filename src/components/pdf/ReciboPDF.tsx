
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Condominio, Recibo, PeriodoCobro } from '@/types';

const palette = {
  green: '#3A7D44',
  lightGreen: 'rgba(58, 125, 68, 0.1)',
  darkText: '#333333',
  lightText: '#555555',
  borderColor: '#E0E0E0',
  red: '#D32F2F',
  footerGray: '#666666',
};

const styles = StyleSheet.create({
  page: { paddingHorizontal: 40, paddingTop: 30, paddingBottom: 70, fontFamily: 'Helvetica', fontSize: 9, color: palette.darkText },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: palette.green, paddingBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', width: '60%' },
  logo: { width: 50, height: 50, marginRight: 10 },
  headerTextContainer: { flexDirection: 'column' },
  condoName: { fontSize: 13, fontWeight: 'bold', color: palette.green, fontFamily: 'Helvetica-Bold' },
  condoInfo: { fontSize: 8, color: palette.lightText },
  headerRight: { textAlign: 'right', width: '40%' },
  receiptTitle: { fontSize: 13, fontWeight: 'bold', color: palette.green, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  receiptInfo: { fontSize: 9, marginBottom: 2 },

  section: { marginTop: 20 },
  sectionTitleContainer: { backgroundColor: palette.lightGreen, paddingVertical: 5, paddingHorizontal: 8, marginBottom: 10, borderRadius: 3 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: palette.green, fontFamily: 'Helvetica-Bold' },

  infoBox: { borderWidth: 1, borderColor: palette.borderColor, borderRadius: 3, padding: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  infoLabel: { color: palette.lightText },
  infoValue: { fontWeight: 'bold', textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  grid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, columnGap: 20 },
  gridCol: { flex: 1 },

  gastosTable: { flexDirection: 'column' },
  gastosRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: palette.borderColor, paddingVertical: 4 },
  gastosDescription: { flex: 1 },
  gastosAmount: { width: '35%', textAlign: 'right' },
  gastosTotalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1.5, borderTopColor: palette.darkText, marginTop: 5, paddingTop: 5 },
  gastosTotalLabel: { fontFamily: 'Helvetica-Bold', fontWeight: 'bold' },
  gastosTotalAmount: { fontFamily: 'Helvetica-Bold', fontWeight: 'bold', textAlign: 'right' },

  summaryBox: { borderWidth: 1, borderColor: palette.borderColor, borderRadius: 3, padding: 10, marginTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: {},
  summaryAmount: { textAlign: 'right' },
  subtotalRow: { borderTopWidth: 1, borderTopColor: palette.borderColor, marginTop: 5, paddingTop: 5 },
  subtotalLabel: { fontFamily: 'Helvetica-Bold', fontWeight: 'bold' },
  subtotalAmount: { fontFamily: 'Helvetica-Bold', fontWeight: 'bold', textAlign: 'right' },
  saldoAnteriorAmount: { color: palette.red, fontFamily: 'Helvetica-Bold', fontWeight: 'bold', textAlign: 'right' },
  totalRow: { borderTopWidth: 2, borderTopColor: palette.green, marginTop: 8, paddingTop: 8 },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontWeight: 'bold', color: palette.green, fontSize: 12 },
  totalAmount: { fontFamily: 'Helvetica-Bold', fontWeight: 'bold', color: palette.green, fontSize: 12, textAlign: 'right' },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: palette.footerGray,
    borderTopWidth: 1,
    borderTopColor: palette.borderColor,
    paddingTop: 10,
  },
  footerBold: { fontFamily: 'Helvetica-Bold', fontWeight: 'bold' },
});

const formatCurrency = (value: number) => `USD${(value || 0).toFixed(2)}`;
const formatPercentage = (value: number) => `${(value || 0).toFixed(4)}%`;

interface ReciboPDFProps {
  recibo: Recibo;
  condominio: Condominio;
  periodo: PeriodoCobro;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const ReciboPDF: React.FC<ReciboPDFProps> = ({ recibo, condominio, periodo }) => {
  const totalFondoReserva = (periodo.totalGastosComunes || 0) * 0.10;
  const totalFondoContingencia = (periodo.totalGastosComunes || 0) * 0.235;
  const totalGeneralCondominio = (periodo.totalGastosComunes || 0) + totalFondoReserva + totalFondoContingencia;

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {condominio.logoUrl && <Image style={styles.logo} src={condominio.logoUrl} />}
          <View style={styles.headerTextContainer}>
            <Text style={styles.condoName}>{condominio.nombre.toUpperCase()}</Text>
            <Text style={styles.condoInfo}>{condominio.direccion}</Text>
            <Text style={styles.condoInfo}>RIF: {condominio.rif}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.receiptTitle}>RECIBO DE CONDOMINIO</Text>
          <Text style={styles.receiptInfo}>Período: {MESES[periodo.mes - 1]} {periodo.ano}</Text>
          <Text style={styles.receiptInfo}>Fecha Emisión: {new Date(recibo.fechaEmision.seconds * 1000).toLocaleDateString('es-VE')}</Text>
          <Text style={styles.receiptInfo}>Recibo N°: {recibo.id.substring(0, 7)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Información del Propietario</Text>
        </View>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Propietario:</Text>
            <Text style={styles.infoValue}>{recibo.inmuebleInfo.propietario}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Inmueble:</Text>
            <Text style={styles.infoValue}>{recibo.inmuebleInfo.identificador}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alícuota:</Text>
            <Text style={styles.infoValue}>{formatPercentage(recibo.inmuebleInfo.alicuota)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {/* Columna Izquierda: Gastos Totales del Condominio */}
        <View style={styles.gridCol}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Gastos Totales del Condominio</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.gastosTable}>
              {recibo.detalleGastosComunes.map((gasto, index) => (
                <View style={styles.gastosRow} key={index}>
                  <Text style={styles.gastosDescription}>{gasto.descripcion}</Text>
                  <Text style={styles.gastosAmount}>{formatCurrency(gasto.montoTotalGasto)}</Text>
                </View>
              ))}
              <View style={styles.gastosRow}>
                <Text style={styles.gastosDescription}>Fondo de Reserva (10%)</Text>
                <Text style={styles.gastosAmount}>{formatCurrency(totalFondoReserva)}</Text>
              </View>
              <View style={styles.gastosRow}>
                <Text style={styles.gastosDescription}>Fondo de Contingencia (23.5%)</Text>
                <Text style={styles.gastosAmount}>{formatCurrency(totalFondoContingencia)}</Text>
              </View>
            </View>
            <View style={styles.gastosTotalRow}>
              <Text style={styles.gastosTotalLabel}>Total General del Condominio</Text>
              <Text style={styles.gastosTotalAmount}>{formatCurrency(totalGeneralCondominio)}</Text>
            </View>
          </View>
        </View>

        {/* Columna Derecha: Cuota Parte y Resumen de Pago */}
        <View style={styles.gridCol}>
          {/* Cuota Parte Individual */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Su Cuota Parte</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.gastosTable}>
              {recibo.detalleGastosComunes.map((gasto, index) => (
                <View style={styles.gastosRow} key={index}>
                  <Text style={styles.gastosDescription}>{gasto.descripcion}</Text>
                  <Text style={styles.gastosAmount}>{formatCurrency(gasto.cuotaParte)}</Text>
                </View>
              ))}
              <View style={styles.gastosRow}>
                <Text style={styles.gastosDescription}>Fondo de Reserva (10%)</Text>
                <Text style={styles.gastosAmount}>{formatCurrency(recibo.cuotaParteFondoReserva)}</Text>
              </View>
              <View style={styles.gastosRow}>
                <Text style={styles.gastosDescription}>Fondo de Contingencia (23.5%)</Text>
                <Text style={styles.gastosAmount}>{formatCurrency(recibo.cuotaParteFondoContingencia)}</Text>
              </View>
            </View>
            <View style={styles.gastosTotalRow}>
              <Text style={styles.gastosTotalLabel}>Total Cuota Parte</Text>
              <Text style={styles.gastosTotalAmount}>{formatCurrency(recibo.subtotalMes)}</Text>
            </View>
          </View>

          {/* Resumen de Pago */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.subtotalLabel}>Sub-Total del Mes:</Text>
              <Text style={styles.subtotalAmount}>{formatCurrency(recibo.subtotalMes)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Saldo Anterior:</Text>
              <Text style={styles.saldoAnteriorAmount}>{formatCurrency(recibo.saldoAnterior)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>TOTAL A PAGAR:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(recibo.totalAPagar)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerBold}>Datos para el Pago</Text>
        <Text>{condominio.datosBancarios}</Text>
        <Text>{condominio.nombre.toUpperCase()}</Text>
        <Text>Correo: {condominio.correoContacto}</Text>
        <Text style={{ marginTop: 8 }}>Para confirmar su pago, por favor envíe el comprobante a la administración. Este documento es un aviso de cobro y no un comprobante de pago.</Text>
      </View>
    </Page>
  </Document>
);
};
