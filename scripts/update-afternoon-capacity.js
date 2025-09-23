
const admin = require('firebase-admin');
const path = require('path');

// --- Configuración ---
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: No se pudo encontrar el archivo "serviceAccountKey.json".');
  console.error('Asegúrate de que el archivo se encuentra en la carpeta /scripts.');
  process.exit(1);
}

// Inicializa la App de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- Lógica del Script ---
async function updateAfternoonClassCapacity() {
  const classesRef = db.collection('classes');
  const afternoonTimes = ['17:00', '18:15', '19:30', '20:45'];
  const newCapacity = 30;

  console.log('Buscando clases de la tarde para actualizar la capacidad...');

  try {
    const snapshot = await classesRef.where('time', 'in', afternoonTimes).get();

    if (snapshot.empty) {
      console.log('No se encontraron clases en los horarios de la tarde para actualizar.');
      return;
    }

    const batch = db.batch();
    snapshot.forEach(doc => {
      console.log(`- Preparando actualización para la clase ${doc.id} (Fecha: ${doc.data().date}, Hora: ${doc.data().time})`);
      const docRef = classesRef.doc(doc.id);
      batch.update(docRef, { capacity: newCapacity });
    });

    await batch.commit();

    console.log('\x1b[32m%s\x1b[0m', `¡Éxito! Se han actualizado ${snapshot.size} clases a una capacidad de ${newCapacity} plazas.`);

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Ha ocurrido un error inesperado durante la actualización:');
    console.error(error);
  } finally {
    // Cierra la conexión de la app para que el script finalice correctamente
    process.exit(0);
  }
}

// Ejecuta la función
updateAfternoonClassCapacity();
