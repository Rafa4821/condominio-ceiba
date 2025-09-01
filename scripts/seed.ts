import * as admin from 'firebase-admin';
import { Concept, Unit, Building } from '../src/types';

// IMPORTANTE: Coloca tu archivo de clave de cuenta de servicio en este directorio
// y renómbralo a 'serviceAccountKey.json'.
// Este archivo NO debe ser subido a tu repositorio de Git.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const BUILDING_ID = 'edificio-ceiba';

async function seedDatabase() {
  console.log('Iniciando el proceso de seeding...');

  const batch = db.batch();

  // 1. Crear/Actualizar el edificio
  const buildingRef = db.collection('buildings').doc(BUILDING_ID);
  const buildingData: Building = {
    id: BUILDING_ID,
    nombre: 'Edificio La Ceiba',
    direccion: 'Av. Siempreviva 742',
    moneda: 'CLP',
    timezone: 'America/Santiago',
  };
  batch.set(buildingRef, buildingData);
  console.log(`- Edificio '${buildingData.nombre}' preparado para seeding.`);

  // 2. Crear unidades
  const units: Omit<Unit, 'id'>[] = [
    { buildingId: BUILDING_ID, nombre: 'Depto 101', email: 'residente101@test.com', coef: 0.25, activo: true, propietarioEmail: 'prop101@test.com' },
    { buildingId: BUILDING_ID, nombre: 'Depto 102', email: 'residente102@test.com', coef: 0.25, activo: true, propietarioEmail: 'prop102@test.com' },
    { buildingId: BUILDING_ID, nombre: 'Depto 201', email: 'residente201@test.com', coef: 0.50, activo: true, propietarioEmail: 'prop201@test.com' },
    { buildingId: BUILDING_ID, nombre: 'Depto 202', email: 'residente202@test.com', coef: 0.0, activo: false, propietarioEmail: 'prop202@test.com' }, // Inactiva
  ];

  units.forEach(unitData => {
    const unitRef = db.collection('units').doc();
    batch.set(unitRef, unitData);
  });
  console.log(`- ${units.length} unidades preparadas para seeding.`);

  // 3. Crear conceptos
  const concepts: Omit<Concept, 'id'>[] = [
    { buildingId: BUILDING_ID, nombre: 'Gasto Común', glosa: 'Cargo base por prorrateo', metodo: 'prorrateo', activo: true },
    { buildingId: BUILDING_ID, nombre: 'Fondo de Reserva', glosa: 'Aporte al fondo de reserva', metodo: 'prorrateo', activo: true },
    { buildingId: BUILDING_ID, nombre: 'Uso de Quincho', glosa: 'Cargo fijo por uso de quincho', metodo: 'fijo', monto: 25000, activo: true },
    { buildingId: BUILDING_ID, nombre: 'Multa por Ruidos Molestos', glosa: 'Multa según reglamento', metodo: 'fijo', monto: 50000, activo: false },
  ];

  concepts.forEach(conceptData => {
    const conceptRef = db.collection('concepts').doc();
    batch.set(conceptRef, conceptData);
  });
  console.log(`- ${concepts.length} conceptos preparados para seeding.`);

  // Ejecutar el batch
  try {
    await batch.commit();
    console.log('\n¡Seeding completado con éxito! La base de datos ha sido poblada.');
  } catch (error) {
    console.error('\nError durante el seeding:', error);
  }
}

seedDatabase();
