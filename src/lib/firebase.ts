"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// PASO 1: Ve a la configuración de tu proyecto en Firebase.
// PASO 2: Encuentra la configuración de tu aplicación web (SDK setup and configuration).
// PASO 3: Copia el objeto de configuración y pégalo aquí para reemplazar este de ejemplo.
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_AUTH_DOMAIN_AQUI",
  projectId: "TU_PROJECT_ID_AQUI",
  storageBucket: "TU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUI",
  appId: "TU_APP_ID_AQUI"
};


// --- No es necesario modificar el código debajo de esta línea ---

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

// ¡RECUERDA! Asegúrate de haber habilitado Firestore Database
// en tu consola de Firebase para que la aplicación funcione correctamente.

export { app, db };
