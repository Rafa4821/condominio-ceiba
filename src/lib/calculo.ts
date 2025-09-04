import { Gasto, Inmueble, Recibo } from '@/types';
import { Timestamp } from 'firebase/firestore';


/**
 * Genera los recibos para todos los inmuebles basado en los gastos de un período.
 */
export function generarRecibos(periodoId: string, gastos: Gasto[], inmuebles: Inmueble[]): Recibo[] {
  const totalAlicuota = inmuebles.reduce((sum, i) => sum + i.alicuota, 0);
  if (totalAlicuota === 0) return [];

  return inmuebles.map(inmueble => {
    // 1. Calcular el total de gastos comunes
    const totalGastosComunes = gastos.reduce((sum, g) => g.categoria === 'comun' ? sum + g.monto : sum, 0);

    // 2. Calcular los fondos como porcentaje de los gastos comunes
    const totalFondoReserva = totalGastosComunes * 0.10; // 10%
    const totalFondoContingencia = totalGastosComunes * 0.235; // 23.5%

    // 3. Calcular la cuota parte de cada concepto para el inmueble
    const cuotaParteGastosComunes = (inmueble.alicuota / totalAlicuota) * totalGastosComunes;
    const cuotaParteFondoReserva = (inmueble.alicuota / totalAlicuota) * totalFondoReserva;
    const cuotaParteFondoContingencia = (inmueble.alicuota / totalAlicuota) * totalFondoContingencia;

    // 4. Calcular totales para el recibo
    const subtotalMes = cuotaParteGastosComunes + cuotaParteFondoReserva + cuotaParteFondoContingencia;
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
      subtotalMes,
      saldoAnterior: inmueble.saldoAnterior,
      totalAPagar,
      estado: 'pendiente',
      fechaEmision: Timestamp.now(),
    };
    return recibo;
  });
}
