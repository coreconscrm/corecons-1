"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASO 1: Ve a la configuración de tu proyecto en Firebase.
// PASO 2: Encuentra la configuración de tu aplicación web (SDK setup and configuration).
// PASO 3: Copia el objeto de configuración y pégalo aquí para reemplazar este de ejemplo.
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzeGtW-b-CI-_CPjth_fRXbLE62Smio2A",
  authDomain: "study-hub-dashboard.firebaseapp.com",
  projectId: "study-hub-dashboard",
  storageBucket: "study-hub-dashboard.firebasestorage.app",
  messagingSenderId: "955037422201",
  appId: "1:955037422201:web:c7aa3f36793a108029baa8"
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
