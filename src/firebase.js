import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCF7aNPFHVr-PwOiQD-xvakja4nm4iLNZo",
  authDomain: "sushi-890bf.firebaseapp.com",
  databaseURL: "https://sushi-890bf-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sushi-890bf",
  storageBucket: "sushi-890bf.firebasestorage.app",
  messagingSenderId: "581156208916",
  appId: "1:581156208916:web:e38536461312caf37b8201"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
