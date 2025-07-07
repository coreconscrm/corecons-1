"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

// PEGA AQUÍ TU OBJETO DE CONFIGURACIÓN DE FIREBASE
// Lo encontrarás en tu consola de Firebase:
// Configuración del proyecto -> Tus Apps -> Configuración del SDK -> Config
const firebaseConfig = {
  apiKey: "AIzaSyCzeGtW-b-CI-_CPjth_fRXbLE62Smio2A",
  authDomain: "study-hub-dashboard.firebaseapp.com",
  projectId: "study-hub-dashboard",
  storageBucket: "study-hub-dashboard.firebasestorage.app",
  messagingSenderId: "955037422201",
  appId: "1:955037422201:web:ac9276c258fec58929baa8"
};


// --- No es necesario modificar el código debajo de esta línea ---

function initializeFirebase(): { app: FirebaseApp; db: Firestore } {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  // Conectamos a tu base de datos específica "wb-data".
  // Si no se especifica, Firestore intenta conectar a la base de datos "(default)".
  const db = getFirestore(app, 'wb-data');
  return { app, db };
}

const { app, db } = initializeFirebase();

export { app, db };
