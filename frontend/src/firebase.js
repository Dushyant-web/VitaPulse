import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBKBYhQVzRMb9qOXIewuPDsXroP7Zyj_VM",
  authDomain: "itapulse-9606a.firebaseapp.com",
  projectId: "vvitapulse-9606a",
  appId: "1:571225078843:web:cfa4dfbcd1739b30ea701e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);