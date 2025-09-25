
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, initializeFirestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// PEGA AQUÍ TU OBJETO DE CONFIGURACIÓN DE FIREBASE
// Lo encontrarás en tu consola de Firebase:
// Configuración del proyecto -> Tus Apps -> Configuración del SDK -> Config
const firebaseConfig = {
  apiKey: "AIzaSyByz0OlMmsS9z2ScOPgtDHlLtmnwI64zUI",
  authDomain: "corecons-1.firebaseapp.com",
  projectId: "corecons-1",
  storageBucket: "corecons-1.firebasestorage.app",
  messagingSenderId: "470077706113",
  appId: "1:470077706113:web:ab400e4e35ee4c111ba280",
};


// --- No es necesario modificar el código debajo de esta línea ---

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {}, 'coreconsddbb');
  storage = getStorage(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app,'coreconsddbb');
  storage = getStorage(app);
}


export { app, auth, db, storage };
