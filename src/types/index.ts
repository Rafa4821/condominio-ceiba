import { Timestamp } from 'firebase/firestore';

// Representa la información del condominio
export interface Condominio {
  id: string;
  nombre: string;
  direccion: string;
  rif: string;
  datosBancarios: string;
  correoContacto: string;
  logoUrl?: string; // URL de descarga, se usará menos
  logoPath?: string; // Ruta al archivo en Firebase Storage
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
  categoria: 'comun' | 'individual' | 'fondo_reserva' | 'fondo_contingencia' | 'fondo_estabilizacion';
  tipo: 'fijo' | 'variable';
  montoFijo?: number; // Monto para gastos fijos
}

// Representa un gasto individual registrado en un período
export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  categoria: ConceptoGasto['categoria'];
}

// Representa un ciclo de facturación (ej: "Julio 2025")
export interface PeriodoCobro {
  id: string;
  mes: number; // 1-12
  ano: number;
  gastos: Gasto[];
  totalGastosComunes: number;
  totalRecaudacion?: number;
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
  subtotalMes: number; // Suma de todas las cuotas partes
  saldoAnterior: number; // Negativo si es deuda, positivo si es crédito/anticipo
  totalAPagar: number;
  estado: 'pendiente' | 'pagado';
  fechaEmision: Timestamp;
  fechaPago?: Timestamp;
}

