import { Gasto, Inmueble, Recibo } from '@/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Calcula los totales de gastos para un período, agrupados por categoría.
 */
export function calcularTotalesPeriodo(gastos: Gasto[]): {
  totalGastosComunes: number;
  totalFondoReserva: number;
  totalFondoContingencia: number;
  totalFondoEstabilizacion: number;
} {
  return gastos.reduce((acc, gasto) => {
    switch (gasto.categoria) {
      case 'comun':
        acc.totalGastosComunes += gasto.monto;
        break;
      case 'fondo_reserva':
        acc.totalFondoReserva += gasto.monto;
        break;
      case 'fondo_contingencia':
        acc.totalFondoContingencia += gasto.monto;
        break;
      case 'fondo_estabilizacion':
        acc.totalFondoEstabilizacion += gasto.monto;
        break;
    }
    return acc;
  }, { 
    totalGastosComunes: 0, 
    totalFondoReserva: 0, 
    totalFondoContingencia: 0, 
    totalFondoEstabilizacion: 0 
  });
}

/**
 * Genera los recibos para todos los inmuebles basado en los gastos de un período.
 */
export function generarRecibos(periodoId: string, gastos: Gasto[], inmuebles: Inmueble[], totales: ReturnType<typeof calcularTotalesPeriodo>): Recibo[] {
  const totalAlicuota = inmuebles.reduce((sum, i) => sum + i.alicuota, 0);
  if (totalAlicuota === 0) return [];

  return inmuebles.map(inmueble => {
    const cuotaParteGastosComunes = (inmueble.alicuota / totalAlicuota) * totales.totalGastosComunes;
    const cuotaParteFondoReserva = (inmueble.alicuota / totalAlicuota) * totales.totalFondoReserva;
    const cuotaParteFondoContingencia = (inmueble.alicuota / totalAlicuota) * totales.totalFondoContingencia;
    const cuotaParteFondoEstabilizacion = (inmueble.alicuota / totalAlicuota) * totales.totalFondoEstabilizacion;

    const subtotalMes = cuotaParteGastosComunes + cuotaParteFondoReserva + cuotaParteFondoContingencia + cuotaParteFondoEstabilizacion;
    const totalAPagar = subtotalMes + inmueble.saldoAnterior;

    const recibo: Recibo = {
      id: '', // Se asignará al guardar en Firestore
      periodoId,
      inmuebleId: inmueble.id,
      inmuebleInfo: {
        identificador: inmueble.identificador,
        propietario: inmueble.propietario.nombre,
        alicuota: inmueble.alicuota,
      },
      detalleGastosComunes: gastos
        .filter(g => g.categoria === 'comun')
        .map(g => ({
          descripcion: g.descripcion,
          montoTotalGasto: g.monto,
          cuotaParte: (inmueble.alicuota / totalAlicuota) * g.monto,
        })),
      cuotaParteGastosComunes,
      cuotaParteFondoReserva,
      cuotaParteFondoContingencia,
      cuotaParteFondoEstabilizacion,
      subtotalMes,
      saldoAnterior: inmueble.saldoAnterior,
      totalAPagar,
      estado: 'pendiente',
      fechaEmision: Timestamp.now(),
    };
    return recibo;
  });
}
