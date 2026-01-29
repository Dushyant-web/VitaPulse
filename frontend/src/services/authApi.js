import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { getIdToken } from "../utils/token";

const BASE_URL = "http://127.0.0.1:5000";

export async function signupHospital(form) {
  const { email, password, hospital_name, hospital_address } = form;

  // 1️⃣ Create Firebase auth user (AUTO LOGIN)
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;
  if (!user) throw new Error("Signup failed");

  // 2️⃣ Get Firebase ID token
  const token = await user.getIdToken();

  // 3️⃣ Create hospital profile in backend
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: hospital_name,
      address: hospital_address,
      email,
    }),
  });

  if (!res.ok) {
    throw new Error("Hospital profile creation failed");
  }

  return true;
}