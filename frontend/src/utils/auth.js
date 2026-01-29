import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export async function logout() {
  await signOut(auth);
  window.location.reload();
}