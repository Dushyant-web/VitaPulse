import { getIdToken } from "../utils/token";

const BASE_URL = "http://127.0.0.1:5000";

// ==============================
// ➕ CREATE PATIENT
// ==============================
export async function createPatient(payload) {
  const token = await getIdToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${BASE_URL}/patients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to create patient");
  }

  return data;
}

