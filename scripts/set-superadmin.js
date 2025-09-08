
const admin = require('firebase-admin');
const path = require('path');

// --- Configuración ---
// El script buscará el archivo de credenciales en la misma carpeta.
// Asegúrate de haber descargado tu serviceAccountKey.json y haberlo puesto aquí.
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: No se pudo encontrar el archivo "serviceAccountKey.json".');
  console.error('Por favor, descarga la clave de tu cuenta de servicio desde la consola de Firebase y colócala en la carpeta /scripts con el nombre "serviceAccountKey.json".');
  process.exit(1);
}

// Inicializa la App de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// --- Lógica del Script ---

// Obtiene el email del argumento de la línea de comandos
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Debes proporcionar un email como argumento.');
  console.log('Uso: npm run set-superadmin <email-del-usuario>');
  process.exit(1);
}

// Función principal asíncrona para usar await
async function setSuperAdminClaim(email) {
  try {
    console.log(`Buscando usuario con el email: ${email}...`);
    // Busca al usuario por su email
    const user = await admin.auth().getUserByEmail(email);

    // Define el Custom Claim
    const customClaims = {
      role: 'superadmin'
    };

    // Asigna el Custom Claim al usuario
    await admin.auth().setCustomUserClaims(user.uid, customClaims);

    console.log('\x1b[32m%s\x1b[0m', `¡Éxito! Se ha asignado el rol 'superadmin' al usuario ${user.email} (UID: ${user.uid})`);
    
    // Opcional: Verifica los claims (descomentar para depurar)
    // const updatedUser = await admin.auth().getUser(user.uid);
    // console.log('Claims actuales:', updatedUser.customClaims);

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('\x1b[31m%s\x1b[0m', `Error: No se encontró ningún usuario con el email "${email}".`);
    } else {
      console.error('\x1b[31m%s\x1b[0m', 'Ha ocurrido un error inesperado:');
      console.error(error);
    }
  } finally {
    // Cierra la conexión de la app para que el script finalice correctamente
     process.exit(0);
  }
}

// Ejecuta la función
setSuperAdminClaim(userEmail);
