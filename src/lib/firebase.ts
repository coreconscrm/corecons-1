"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASO 1: Ve a la configuración de tu proyecto en Firebase.
// PASO 2: Encuentra la configuración de tu aplicación web (SDK setup and configuration).
// PASO 3: Copia el objeto de configuración y pégalo aquí para reemplazar este de ejemplo.
const firebaseConfig = {
  apiKey: "AIzaSy...TUS_DATOS_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TUS_DATOS_AQUI",
  appId: "1:TUS_DATOS_AQUI:web:TUS_DATOS_AQUI"
};

// --- No es necesario modificar el código debajo de esta línea ---

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

// ¡RECUERDA! Asegúrate de haber habilitado Authentication y Firestore Database
// en tu consola de Firebase para que la aplicación funcione correctamente.

export { app, auth, db };
