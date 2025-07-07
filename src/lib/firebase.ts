"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// He rellenado la configuración con los datos de tu captura de pantalla.
// Para completarlo, copia el objeto de configuración COMPLETO de tu consola
// (Configuración del proyecto -> Tus Apps -> Configuración del SDK -> Config) 
// y reemplaza este objeto.
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzeGtW-b-CI-_CPjth_fRXbLE62Smio2A",
  authDomain: "study-hub-dashboard.firebaseapp.com",
  projectId: "study-hub-dashboard",
  storageBucket: "study-hub-dashboard.firebasestorage.app",
  messagingSenderId: "955037422201",
  appId: "1:955037422201:web:ac9276c258fec58929baa8"
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
