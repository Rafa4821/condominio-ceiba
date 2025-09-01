import { Timestamp } from 'firebase/firestore';

// Representa la información del condominio
export interface Condominio {
  id: string;
  nombre: string;
  direccion: string;
  rif: string;
  datosBancarios: string;
  logoUrl?: string;
  moneda: 'USD'; // Moneda fija para el sistema
}

// Representa la ficha de cada apartamento o casa
export interface Inmueble {
  id: string;
  identificador: string; // Ej: "Apto 10-A", "Casa 25"
  propietario: {
    nombre: string;
    email: string;
    telefono?: string;
  };
  inquilino?: {
    nombre: string;
    email: string;
    telefono?: string;
  };
  alicuota: number; // Porcentaje de participación, ej: 1.041
  saldoAnterior: number; // Deuda (-) o crédito (+)
}

// Representa una plantilla o tipo de gasto que se puede registrar
export interface ConceptoGasto {
  id: string;
  descripcion: string;
  categoria: 'comun' | 'fondo_reserva' | 'fondo_contingencia' | 'individual' | 'fondo_estabilizacion';
}

// Representa un gasto individual registrado en un período
export interface Gasto {
  id: string;
  descripcion: string;
  monto: number; // Monto total del gasto en USD
  categoria: 'comun' | 'fondo_reserva' | 'fondo_contingencia' | 'individual' | 'fondo_estabilizacion';
}

// Representa un ciclo de facturación (ej: "Julio 2025")
export interface PeriodoCobro {
  id: string;
  mes: number; // 1-12
  ano: number;
  gastos: Gasto[];
  totalGastosComunes: number;
  totalFondoReserva: number;
  totalFondoContingencia: number;
  totalFondoEstabilizacion: number; // Añadido para flexibilidad
  estado: 'borrador' | 'publicado';
  fechaCreacion: Timestamp;
}

// Representa el recibo individual generado para un inmueble en un período
export interface Recibo {
  id: string;
  periodoId: string;
  inmuebleId: string;
  inmuebleInfo: { // Denormalizado para facilitar la generación del PDF
    identificador: string;
    propietario: string;
    alicuota: number;
  };
  detalleGastosComunes: {
    descripcion: string;
    montoTotalGasto: number;
    cuotaParte: number;
  }[];
  cuotaParteGastosComunes: number;
  cuotaParteFondoReserva: number;
  cuotaParteFondoContingencia: number;
  cuotaParteFondoEstabilizacion: number;
  subtotalMes: number; // Suma de todas las cuotas partes
  saldoAnterior: number; // Negativo si es deuda, positivo si es crédito/anticipo
  totalAPagar: number;
  estado: 'pendiente' | 'pagado';
  fechaEmision: Timestamp;
  fechaPago?: Timestamp;
}

