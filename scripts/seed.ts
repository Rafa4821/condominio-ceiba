import * as admin from 'firebase-admin';
import { Condominio, Inmueble, ConceptoGasto } from '../src/types';

// IMPORTANTE: Coloca tu archivo de clave de cuenta de servicio en este directorio
// y renómbralo a 'serviceAccountKey.json'.
// Este archivo NO debe ser subido a tu repositorio de Git.
// @ts-expect-error -- El archivo serviceAccountKey.json no está en el repositorio, por lo que se espera un error de importación durante el linting.
import serviceAccount from './serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const CONDOMINIO_ID = 'edificio-ceiba';

async function seedDatabase() {
  console.log('Iniciando el proceso de seeding...');

  const batch = db.batch();

  // 1. Crear/Actualizar el edificio
  const condominioRef = db.collection('condominios').doc(CONDOMINIO_ID);
  const condominioData: Condominio = {
    id: CONDOMINIO_ID,
    nombre: 'Edificio La Ceiba',
    direccion: 'Av. Siempreviva 742',
    rif: 'J-12345678-9',
    datosBancarios: 'Banco Ficticio, Cta. Corriente 123-456-789',
    correoContacto: 'contacto@edificioceiba.com',
    moneda: 'USD',
    porcentajeFondoReserva: 10, // 10%
    porcentajeFondoContingencia: 5, // 5%
  };
  batch.set(condominioRef, condominioData);
  console.log(`- Condominio '${condominioData.nombre}' preparado para seeding.`);

  // 2. Crear unidades
  const inmuebles: Omit<Inmueble, 'id'>[] = [
    { identificador: 'Depto 101', propietario: { nombre: 'Juan Pérez', email: 'prop101@test.com' }, alicuota: 0.25, saldoAnterior: 0 },
    { identificador: 'Depto 102', propietario: { nombre: 'Ana García', email: 'prop102@test.com' }, alicuota: 0.25, saldoAnterior: -50 }, // Con deuda
    { identificador: 'Depto 201', propietario: { nombre: 'Luis Torres', email: 'prop201@test.com' }, alicuota: 0.50, saldoAnterior: 25 }, // Con saldo a favor
  ];

  inmuebles.forEach(inmuebleData => {
    const inmuebleRef = db.collection('inmuebles').doc();
    batch.set(inmuebleRef, inmuebleData);
  });
  console.log(`- ${inmuebles.length} inmuebles preparados para seeding.`);

  // 3. Crear conceptos
  const conceptos: Omit<ConceptoGasto, 'id'>[] = [
    { descripcion: 'Sueldo Conserje', categoria: 'comun', tipo: 'fijo', montoFijo: 500 },
    { descripcion: 'Mantenimiento Ascensor', categoria: 'comun', tipo: 'fijo', montoFijo: 150 },
    { descripcion: 'Electricidad Áreas Comunes', categoria: 'comun', tipo: 'variable' },
    { descripcion: 'Agua Áreas Comunes', categoria: 'comun', tipo: 'variable' },
    { descripcion: 'Multa por ruido molesto', categoria: 'individual', tipo: 'variable' },
    { descripcion: 'Reparación de grifería (Apto 101)', categoria: 'individual', tipo: 'variable' },
  ];

  conceptos.forEach(conceptoData => {
    const conceptoRef = db.collection('conceptosGasto').doc();
    batch.set(conceptoRef, conceptoData);
  });
  console.log(`- ${conceptos.length} conceptos de gasto preparados para seeding.`);

  // Ejecutar el batch
  try {
    await batch.commit();
    console.log('\n¡Seeding completado con éxito! La base de datos ha sido poblada.');
  } catch (error) {
    console.error('\nError durante el seeding:', error);
  }
}

seedDatabase();
