// src/lib/calculo.ts
import { Concept, Unit, ReceiptItem, ParamKey } from '@/types';

/**
 * Genera el desglose de items para los recibos de todas las unidades activas.
 * @param conceptos - La lista de conceptos a aplicar para el mes.
 * @param unidades - Todas las unidades del edificio.
 * @returns Un mapa donde la clave es el ID de la unidad y el valor es la lista de items del recibo.
 */
export function generarRecibos(conceptos: Concept[], unidades: Unit[]): Map<string, ReceiptItem[]> {
  const unidadesActivas = unidades.filter(u => u.activo);
  if (unidadesActivas.length === 0) {
    return new Map();
  }

  const totalCoeficientes = unidadesActivas.reduce((sum, u) => sum + u.coef, 0);
  const recibosMap = new Map<string, ReceiptItem[]>();

  // Inicializar el mapa para cada unidad activa
  unidadesActivas.forEach(u => {
    recibosMap.set(u.id, []);
  });

  conceptos.forEach(c => {
    if (!c.activo) return; // Omitir conceptos inactivos

    switch (c.metodo) {
      case 'prorrateo':
        if (c.monto && totalCoeficientes > 0) {
          unidadesActivas.forEach(u => {
            const montoProrrateado = (u.coef / totalCoeficientes) * c.monto!;
            recibosMap.get(u.id)?.push({ conceptoId: c.id, nombre: c.nombre, glosa: c.glosa, monto: Math.round(montoProrrateado) });
          });
        }
        break;

      case 'fijo':
        if (c.monto) {
          unidadesActivas.forEach(u => {
            recibosMap.get(u.id)?.push({ conceptoId: c.id, nombre: c.nombre, glosa: c.glosa, monto: c.monto! });
          });
        }
        break;

      case 'parametro':
        if (c.paramKey && c.tarifa) {
          unidadesActivas.forEach(u => {
            const valorParametro = u[c.paramKey as keyof Unit] as number | undefined;
            if (typeof valorParametro === 'number') {
              const montoCalculado = valorParametro * c.tarifa!;
              recibosMap.get(u.id)?.push({ conceptoId: c.id, nombre: c.nombre, glosa: c.glosa, monto: Math.round(montoCalculado) });
            }
          });
        }
        break;
    }
  });

  return recibosMap;
}

/**
 * Calcula el total de un conjunto de items de recibo.
 * @param items - Array de ReceiptItem.
 * @returns La suma total de los montos.
 */
export function calcularTotalRecibo(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.monto, 0);
}
