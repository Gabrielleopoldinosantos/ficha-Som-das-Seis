// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCp5slzZKVuMQ5N86zv2vXbvMGEeNwem94",
  authDomain: "sds-ficha.firebaseapp.com",
  projectId: "sds-ficha",
  storageBucket: "sds-ficha.firebasestorage.app",
  messagingSenderId: "406558124782",
  appId: "1:406558124782:web:e1f68e6693a57dde7ea1ff",
  measurementId: "G-79SRX1P4D7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);