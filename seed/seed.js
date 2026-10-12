// Script de una sola vez: sube las listas, el inventario inicial y las
// cuentas del personal a tu proyecto real de Firebase.
//
// ANTES DE CORRERLO:
// 1) Descarga tu llave de cuenta de servicio (Firebase Console > Configuración
//    del proyecto > Cuentas de servicio > Generar nueva clave privada) y
//    guárdala en esta misma carpeta como serviceAccountKey.json
// 2) Edita la lista STAFF más abajo con los correos y contraseñas reales
//    de tu Administrador y tu(s) Trabajador(es).
// 3) Corre: npm install   (una sola vez)
//    luego: node seed.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const grades = require('./grades.json');
const uniformsData = require('./uniforms.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

// ---- EDITA ESTO con las cuentas reales de tu personal ----
// (escribe las contraseñas solo al momento de correrlo y bórralas después; no las guardes aquí)
const STAFF = [
  { email: 'karenarumil@hotmail.com',  password: '', nombre: 'Administrador',      rol: 'Administrador' },
  { email: 'karenarumil@hotmail.com', password: '', nombre: 'Personal de tienda',  rol: 'Trabajador' },
];
// Existencia inicial por defecto (ajústala luego desde el panel de Inventario)
const STOCK_UTILES_DEFAULT = 20;
const STOCK_UNIFORMES_DEFAULT = 10;
// ------------------------------------------------------------

function slug(str) {
  return String(str)
    .trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function seedListas() {
  const batch = db.batch();
  for (const [gradeName, gradeData] of Object.entries(grades)) {
    const docId = slug(gradeName); // ej. "1ro_primaria"
    batch.set(db.collection('listas').doc(docId), {
      nombre: gradeName,
      items: gradeData.items,
      total_libros: gradeData.total_libros,
      total_paquete: gradeData.total_paquete,
    });
  }
  await batch.commit();
  console.log('✔ listas sembradas:', Object.keys(grades).length, 'grados');
}

async function seedInventario() {
  const batch = db.batch();
  let count = 0;
  for (const [gradeName, gradeData] of Object.entries(grades)) {
    gradeData.items.forEach((it, i) => {
      const key = `${slug(gradeName)}_${i}`;
      batch.set(db.collection('inventario').doc(key), {
        tipo: 'util',
        grado: gradeName,
        idx: i,
        descripcion: it.descripcion,
        precio_unitario: it.precio_unitario,
        stock: STOCK_UTILES_DEFAULT,
      });
      count++;
    });
  }
  for (const u of uniformsData.uniforms) {
    for (const talla of uniformsData.sizes) {
      const key = `${u.id}_${talla}`;
      batch.set(db.collection('inventario').doc(key), {
        tipo: 'uniforme',
        uniformeId: u.id,
        nombre: u.name,
        talla,
        precio_unitario: u.price,
        stock: STOCK_UNIFORMES_DEFAULT,
      });
      count++;
    }
  }
  await batch.commit();
  console.log('✔ inventario sembrado:', count, 'artículos (con existencia de ejemplo, ajústala en el panel)');
}

async function seedUsuarios() {
  for (const s of STAFF) {
    if (s.password.startsWith('CAMBIA-ESTA-CLAVE')) {
      console.log(`⚠ Saltando a ${s.email}: primero edita su contraseña real en seed.js`);
      continue;
    }
    let user;
    try {
      user = await auth.createUser({ email: s.email, password: s.password, displayName: s.nombre });
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        user = await auth.getUserByEmail(s.email);
      } else {
        throw e;
      }
    }
    await db.collection('usuarios').doc(user.uid).set({ nombre: s.nombre, rol: s.rol, email: s.email });
    console.log(`✔ usuario listo: ${s.email} (${s.rol})`);
  }
}

(async () => {
  await seedListas();
  await seedInventario();
  await seedUsuarios();
  console.log('\nLISTO. Puedes borrar serviceAccountKey.json de tu computadora si quieres (no lo subas a ningún repositorio público).');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
