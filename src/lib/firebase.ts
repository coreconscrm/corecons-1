
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, initializeFirestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// PEGA AQUÍ TU OBJETO DE CONFIGURACIÓN DE FIREBASE
// Lo encontrarás en tu consola de Firebase:
// Configuración del proyecto -> Tus Apps -> Configuración del SDK -> Config
const firebaseConfig = {
  apiKey: "AIzaSyCzeGtW-b-CI-_CPjth_fRXbLE62Smio2A",
  authDomain: "study-hub-dashboard.firebaseapp.com",
  projectId: "study-hub-dashboard",
  storageBucket: "study-hub-dashboard.appspot.com",
  messagingSenderId: "955037422201",
  appId: "1:955037422201:web:ac9276c258fec58929baa8"
};


// --- No es necesario modificar el código debajo de esta línea ---

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {}, 'wb-data');
  storage = getStorage(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app,'wb-data');
  storage = getStorage(app);
}


export { app, auth, db, storage };
