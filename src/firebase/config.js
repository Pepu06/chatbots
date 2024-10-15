import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadImage = async (blob) => {
  const storage = getStorage(); // Obtén la instancia de Storage
  const storageRef = ref(storage, `images/${Date.now()}.jpg`); // Crea una referencia para el archivo

  try {
    // Sube la imagen
    await uploadBytes(storageRef, blob);
    console.log("Upload successful!");

    // Obtén la URL de descarga
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL; // Devuelve la URL de la imagen subida
  } catch (error) {
    console.error("Error uploading image: ", error);
    throw error; // Propaga el error
  }
};

const firebaseConfig = {
  apiKey: "AIzaSyD6G-qB0yf-mImZwxVpeRulb6ftpZOrh9g",
  authDomain: "luces-de-casa-73961.firebaseapp.com",
  projectId: "luces-de-casa-73961",
  storageBucket: "luces-de-casa-73961.appspot.com",
  messagingSenderId: "327893965788",
  appId: "1:327893965788:web:0936f5b312c1e155370d19",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default db;
