import { describe, it, expect } from 'vitest';
import { generarRecibos } from './calculo';
import { Condominio, Gasto, Inmueble } from '../types';

const mockCondominio: Condominio = {
  id: 'condo-1',
  nombre: 'Condominio Ceiba',
  direccion: 'Direccion Test',
  rif: 'J-12345678-9',
  moneda: 'USD',
  logoUrl: '',
  datosBancarios: '',
  correoContacto: '',
  porcentajeFondoReserva: 10,
  porcentajeFondoContingencia: 20,
};

describe('generarRecibos', () => {

  describe('Caso de prueba A: UI Example', () => {
    const inmuebleTest: Inmueble[] = [{
      id: 'inm-A',
      identificador: '2A',
      alicuota: 1.6120,
      propietario: {
        nombre: 'Francisco Isea',
        email: 'test@test.com',
      },
      saldoAnterior: 0,
    }];

    const gastosTest: Gasto[] = [
      { id: 'gasto-A', descripcion: 'prueba1', monto: 10000, categoria: 'comun' },
    ];

    const condominioTest: Condominio = {
      ...mockCondominio,
      porcentajeFondoReserva: 10,
      porcentajeFondoContingencia: 20,
    };

    it('debe calcular los montos de cuota parte correctamente', () => {
      const recibos = generarRecibos('p-1', gastosTest, inmuebleTest, condominioTest);
      const recibo = recibos[0];

      const totalGastosComunes = 10000;
      const alicuotaFraccion = 1.6120 / 100;

      const cuotaParteGastos = totalGastosComunes * alicuotaFraccion;
      expect(recibo.cuotaParteGastosComunes).toBeCloseTo(161.20);

      const totalFondoReserva = totalGastosComunes * (10 / 100);
      const cuotaParteReserva = totalFondoReserva * alicuotaFraccion;
      expect(recibo.cuotaParteFondoReserva).toBeCloseTo(16.12);

      const totalFondoContingencia = totalGastosComunes * (20 / 100);
      const cuotaParteContingencia = totalFondoContingencia * alicuotaFraccion;
      expect(recibo.cuotaParteFondoContingencia).toBeCloseTo(32.24);
      
      expect(recibo.subtotalMes).toBeCloseTo(209.56);
      expect(recibo.totalAPagar).toBeCloseTo(209.56);
    });
  });

  describe('Caso de prueba B: Recibo Real Apto 6C', () => {
    const inmuebleTest: Inmueble[] = [{
      id: 'inm-B',
      identificador: '6C',
      alicuota: 1.041,
      propietario: {
        nombre: 'Propietario 6C',
        email: '6c@test.com',
      },
      saldoAnterior: 0,
    }];

    const gastosTest: Gasto[] = [
      { id: 'gasto-B', descripcion: 'Gastos varios', monto: 1278.97, categoria: 'comun' },
    ];

    const condominioTest: Condominio = {
      ...mockCondominio,
      porcentajeFondoReserva: 10,
      porcentajeFondoContingencia: 23.46,
    };

    it('debe calcular los montos de cuota parte para un caso real', () => {
      const recibos = generarRecibos('p-2', gastosTest, inmuebleTest, condominioTest);
      const recibo = recibos[0];

      expect(recibo.cuotaParteGastosComunes).toBeCloseTo(13.31, 2);
      expect(recibo.cuotaParteFondoReserva).toBeCloseTo(1.33, 2);
      expect(recibo.cuotaParteFondoContingencia).toBeCloseTo(3.12, 2);
      // Redondeamos el resultado final para la comparación, evitando errores de punto flotante.
      const subtotalRedondeado = parseFloat(recibo.subtotalMes.toFixed(2));
      expect(subtotalRedondeado).toBe(17.77);
      expect(recibo.totalAPagar).toBeCloseTo(17.77, 2);
    });
  });

  it('debería retornar un array vacío si no hay inmuebles', () => {
    const recibos = generarRecibos('p-3', [], [], mockCondominio);
    expect(recibos).toHaveLength(0);
  });

  it('debería manejar el caso sin gastos comunes', () => {
    const inmuebleTest: Inmueble[] = [{
      id: 'inm-C',
      identificador: '3C',
      alicuota: 5.0,
      propietario: {
        nombre: 'Propietario 3C',
        email: '3c@test.com',
      },
      saldoAnterior: 50,
    }];

    const recibos = generarRecibos('p-4', [], inmuebleTest, mockCondominio);
    const recibo = recibos[0];

    expect(recibo.cuotaParteGastosComunes).toBe(0);
    expect(recibo.cuotaParteFondoReserva).toBe(0);
    expect(recibo.cuotaParteFondoContingencia).toBe(0);
    expect(recibo.subtotalMes).toBe(0);
    expect(recibo.totalAPagar).toBe(50);
  });
});
