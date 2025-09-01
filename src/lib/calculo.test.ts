import { describe, it, expect } from 'vitest';
import { generarRecibos, calcularTotalRecibo } from './calculo';
import { Concept, Unit, ReceiptItem } from '@/types';

// Mock Data
const unidades: Unit[] = [
  { id: 'u1', nombre: 'Depto 101', email: 'a@a.com', coef: 0.25, m2: 50, residentes: 2, activo: true, buildingId: 'b1' },
  { id: 'u2', nombre: 'Depto 102', email: 'b@b.com', coef: 0.50, m2: 100, residentes: 4, activo: true, buildingId: 'b1' },
  { id: 'u3', nombre: 'Depto 103', email: 'c@c.com', coef: 0.25, m2: 50, residentes: 1, activo: true, buildingId: 'b1' },
  { id: 'u4', nombre: 'Bodega 1', email: 'd@d.com', coef: 0.0, m2: 10, residentes: 0, activo: false, buildingId: 'b1' }, // Inactiva
];

describe('generarRecibos', () => {

  it('should handle prorrateo correctly', () => {
    const conceptos: Concept[] = [
      { id: 'c1', nombre: 'Gasto Común', glosa: '...', metodo: 'prorrateo', monto: 100000, activo: true, buildingId: 'b1' },
    ];
    const recibos = generarRecibos(conceptos, unidades);
    expect(recibos.get('u1')?.[0].monto).toBe(25000);
    expect(recibos.get('u2')?.[0].monto).toBe(50000);
    expect(recibos.get('u3')?.[0].monto).toBe(25000);
    expect(recibos.has('u4')).toBe(false); // No debe generar para inactivas
  });

  it('should handle metodo fijo correctly', () => {
    const conceptos: Concept[] = [
      { id: 'c2', nombre: 'Cuota Estacionamiento', glosa: '...', metodo: 'fijo', monto: 15000, activo: true, buildingId: 'b1' },
    ];
    const recibos = generarRecibos(conceptos, unidades);
    expect(recibos.get('u1')?.[0].monto).toBe(15000);
    expect(recibos.get('u2')?.[0].monto).toBe(15000);
    expect(recibos.get('u3')?.[0].monto).toBe(15000);
  });

  it('should handle parametro (m2) correctly', () => {
    const conceptos: Concept[] = [
      { id: 'c3', nombre: 'Calefacción', glosa: '...', metodo: 'parametro', paramKey: 'm2', tarifa: 500, activo: true, buildingId: 'b1' },
    ];
    const recibos = generarRecibos(conceptos, unidades);
    expect(recibos.get('u1')?.[0].monto).toBe(25000); // 50m2 * 500
    expect(recibos.get('u2')?.[0].monto).toBe(50000); // 100m2 * 500
    expect(recibos.get('u3')?.[0].monto).toBe(25000); // 50m2 * 500
  });

  it('should handle multiple concepts', () => {
    const conceptos: Concept[] = [
      { id: 'c1', nombre: 'Gasto Común', glosa: '...', metodo: 'prorrateo', monto: 100000, activo: true, buildingId: 'b1' },
      { id: 'c2', nombre: 'Cuota Fija', glosa: '...', metodo: 'fijo', monto: 10000, activo: true, buildingId: 'b1' },
    ];
    const recibos = generarRecibos(conceptos, unidades);
    const recibo_u1 = recibos.get('u1');
    expect(recibo_u1).toHaveLength(2);
    expect(recibo_u1?.[0].monto).toBe(25000);
    expect(recibo_u1?.[1].monto).toBe(10000);
  });

  it('should ignore inactive concepts', () => {
    const conceptos: Concept[] = [
      { id: 'c1', nombre: 'Activo', glosa: '...', metodo: 'fijo', monto: 100, activo: true, buildingId: 'b1' },
      { id: 'c2', nombre: 'Inactivo', glosa: '...', metodo: 'fijo', monto: 200, activo: false, buildingId: 'b1' },
    ];
    const recibos = generarRecibos(conceptos, unidades);
    expect(recibos.get('u1')).toHaveLength(1);
    expect(recibos.get('u1')?.[0].nombre).toBe('Activo');
  });

  it('should return an empty map if no active units', () => {
    const recibos = generarRecibos([], unidades.filter(u => !u.activo));
    expect(recibos.size).toBe(0);
  });
});

describe('calcularTotalRecibo', () => {
  it('should sum the amounts of receipt items', () => {
    const items: ReceiptItem[] = [
      { conceptoId: 'c1', nombre: 'A', glosa: '...', monto: 100 },
      { conceptoId: 'c2', nombre: 'B', glosa: '...', monto: 250 },
      { conceptoId: 'c3', nombre: 'C', glosa: '...', monto: 50 },
    ];
    expect(calcularTotalRecibo(items)).toBe(400);
  });

  it('should return 0 for an empty array', () => {
    expect(calcularTotalRecibo([])).toBe(0);
  });
});
