import { getIdToken } from "/src/utils/token.js";

const BASE_URL = "http://127.0.0.1:5000";

export async function predictAndSave(payload) {
  const token = await getIdToken();
  if (!token) {
    throw new Error("Unauthorized: No token");
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.error("❌ Network / CORS error:", networkError);
    throw new Error("Cannot reach backend (CORS / server down)");
  }

  let data;
  try {
    data = await res.json();
  } catch (parseError) {
    console.error("❌ Response is not JSON");
    throw new Error("Backend did not return JSON");
  }

  if (!res.ok) {
    console.error("❌ Backend error:", data);
    throw new Error(data.error || "Prediction failed");
  }

  return data;
}