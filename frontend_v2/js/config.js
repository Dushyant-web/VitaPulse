// 🔐 Firebase Config (use SAME project as backend)
const firebaseConfig = {
  apiKey: "AIzaSyBKBYhQVzRMb9qOXIewuPDsXroP7Zyj_VM",
  authDomain: "itapulse-9606a.firebaseapp.com",
  projectId: "vvitapulse-9606a",
  appId: "1:571225078843:web:cfa4dfbcd1739b30ea701e"
};


firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

// 🌐 Backend base URL
const BASE_URL = "http://127.0.0.1:5000";