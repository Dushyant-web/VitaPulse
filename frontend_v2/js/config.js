//  Firebase Config (Frontend Auth only)
const firebaseConfig = {
  apiKey: "AIzaSyBKBYhQVzRMb9qOXIewuPDsXroP7Zyj_VM",
  authDomain: "vitapulse-9606a.firebaseapp.com",
  projectId: "vitapulse-9606a",
  appId: "1:571225078843:web:cfa4dfbcd1739b30ea701e"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// LOCAL BACKEND
const BASE_URL = "http://127.0.0.1:5000";