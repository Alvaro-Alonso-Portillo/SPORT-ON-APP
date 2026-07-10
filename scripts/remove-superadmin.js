const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: No se pudo encontrar el archivo "serviceAccountKey.json".');
  console.error('Por favor, descarga la clave de tu cuenta de servicio desde la consola de Firebase y colócala en la carpeta /scripts con el nombre "serviceAccountKey.json".');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Debes proporcionar un email como argumento.');
  console.log('Uso: npm run remove-superadmin <email-del-usuario>');
  process.exit(1);
}

async function removeSuperAdminClaim(email) {
  try {
    console.log(`Buscando usuario con el email: ${email}...`);
    const user = await admin.auth().getUserByEmail(email);
    const currentClaims = user.customClaims || {};

    if (currentClaims.role !== 'superadmin') {
      console.log('\x1b[33m%s\x1b[0m', `El usuario ${user.email} no tiene el rol 'superadmin'. No se realizaron cambios.`);
      return;
    }

    const { role, ...remainingClaims } = currentClaims;
    await admin.auth().setCustomUserClaims(user.uid, Object.keys(remainingClaims).length ? remainingClaims : null);

    console.log('\x1b[32m%s\x1b[0m', `¡Éxito! Se ha eliminado el rol 'superadmin' del usuario ${user.email} (UID: ${user.uid})`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('\x1b[31m%s\x1b[0m', `Error: No se encontró ningún usuario con el email "${email}".`);
    } else {
      console.error('\x1b[31m%s\x1b[0m', 'Ha ocurrido un error inesperado:');
      console.error(error);
    }
  } finally {
    process.exit(0);
  }
}

removeSuperAdminClaim(userEmail);
