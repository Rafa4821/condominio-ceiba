import { Condominio, Gasto, Inmueble, Recibo } from '@/types';
import { Timestamp } from 'firebase/firestore';


/**
 * Genera los recibos para todos los inmuebles basado en los gastos de un período.
 */
export function generarRecibos(periodoId: string, gastos: Gasto[], inmuebles: Inmueble[], condominio: Condominio): Recibo[] {
  // 1. Calcular el total de gastos comunes del período.
  const totalGastosComunes = gastos.reduce((sum, g) => g.categoria === 'comun' ? sum + g.monto : sum, 0);

  // 2. Calcular los montos totales de los fondos para todo el condominio.
  const totalFondoReserva = totalGastosComunes * (condominio.porcentajeFondoReserva / 100);
  const totalFondoContingencia = totalGastosComunes * (condominio.porcentajeFondoContingencia / 100);

  return inmuebles.map(inmueble => {
    // La alícuota se trata como un porcentaje (ej. 1.612 para 1.612%)
    const alicuotaComoFraccion = inmueble.alicuota / 100;

    // 3. Calcular la cuota parte de los gastos comunes para el inmueble.
    const cuotaParteGastosComunes = totalGastosComunes * alicuotaComoFraccion;

    // 4. Calcular la cuota parte de los fondos para el inmueble.
    const cuotaParteFondoReserva = totalFondoReserva * alicuotaComoFraccion;
    const cuotaParteFondoContingencia = totalFondoContingencia * alicuotaComoFraccion;

    // 5. Calcular totales para el recibo del inmueble.
    const subtotalMes = cuotaParteGastosComunes + cuotaParteFondoReserva + cuotaParteFondoContingencia;
    const totalAPagar = subtotalMes + inmueble.saldoAnterior;

    const recibo: Recibo = {
      id: '', // El ID se asigna en el batch de Firestore
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
          cuotaParte: g.monto * alicuotaComoFraccion, // Cuota parte de cada gasto individual
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
