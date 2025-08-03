
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, initializeFirestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

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

function initializeFirebase(): { app: FirebaseApp; db: Firestore; storage: FirebaseStorage; } {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  
  const db = initializeFirestore(app, {}, 'wb-data');
  
  // Forzar la conexión al bucket de almacenamiento correcto.
  const storage = getStorage(app, firebaseConfig.storageBucket);
  return { app, db, storage };
}

const { app, db, storage } = initializeFirebase();

export { app, db, storage };
