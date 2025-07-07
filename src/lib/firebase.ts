"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// He rellenado la configuración con los datos de tu captura de pantalla.
// Para completarlo, copia el objeto de configuración COMPLETO de tu consola
// (Configuración del proyecto -> Tus Apps -> Configuración del SDK -> Config) 
// y reemplaza este objeto.
const firebaseConfig = {
  apiKey: "AlzaSyCzeGtW-b-CI-_CPjth_fRXbLE62Smio2A",
  authDomain: "study-hub-dashboard.firebaseapp.com",
  projectId: "study-hub-dashboard",
  storageBucket: "study-hub-dashboard.appspot.com",
  messagingSenderId: "955037422201",
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
