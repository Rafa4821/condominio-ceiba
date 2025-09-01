import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import { Recibo, Condominio } from '@/types';

interface ReceiptEmailProps {
  recibo: Recibo;
  condominio: Condominio;
  periodo: { mes: number; ano: number; };
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const ReceiptEmail: React.FC<Readonly<ReceiptEmailProps>> = ({ recibo, condominio, periodo }) => (
  <Html>
    <Head />
    <Preview>Recibo de Condominio - {condominio.nombre} - {MESES[periodo.mes - 1]} {periodo.ano.toString()}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Aquí podrías agregar el logo del condominio si lo tuvieras */}
        {/* <Img src={`${baseUrl}/static/logo.png`} width="42" height="42" alt="Logo" /> */}
        <Heading style={heading}>Recibo de Condominio</Heading>
        <Section style={box}>
          <Text style={paragraph}>
            Estimado(a) <strong>{recibo.inmuebleInfo.propietario}</strong>,
          </Text>
          <Text style={paragraph}>
            Adjunto a este correo encontrarás el recibo de gastos comunes correspondiente al período de <strong>{MESES[periodo.mes - 1]} de {periodo.ano}</strong> para tu inmueble <strong>{recibo.inmuebleInfo.identificador}</strong>.
          </Text>
          <Text style={{ ...paragraph, marginTop: '20px' }}>
            El monto total a pagar es de <strong>${recibo.totalAPagar.toFixed(2)} USD</strong>.
          </Text>
          <Text style={paragraph}>
            Por favor, revisa el documento PDF adjunto para ver el desglose completo de los gastos.
          </Text>
        </Section>
        <Section style={{ marginTop: '20px' }}>
          <Text style={paragraph}>Atentamente,</Text>
          <Text style={{ ...paragraph, fontWeight: 'bold' }}>La Administración de {condominio.nombre}</Text>
        </Section>
        <Text style={footer}>
          {condominio.direccion}
        </Text>
      </Container>
    </Body>
  </Html>
);

// Estilos para el correo
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  width: '580px',
};

const box = {
  padding: '0 48px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  color: '#333',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '20px',
};

