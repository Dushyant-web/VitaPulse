import { auth } from "../firebase";

export async function getIdToken() {
  const user = auth.currentUser;

  if (!user) {
    console.error("❌ No Firebase user found");
    return null;
  }

  try {
    const token = await user.getIdToken(true); // force refresh
    return token;
  } catch (err) {
    console.error("❌ Failed to get ID token", err);
    return null;
  }
}