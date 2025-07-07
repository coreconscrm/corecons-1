"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza esto con la configuración de tu proyecto de Firebase.
// Puedes encontrarla en la consola de Firebase, en la configuración de tu proyecto.
const firebaseConfig = {
  apiKey: "AIzaSy...TUS_DATOS_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TUS_DATOS_AQUI",
  appId: "1:TUS_DATOS_AQUI:web:TUS_DATOS_AQUI"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
