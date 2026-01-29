import { getIdToken } from "../utils/token";

const BASE_URL = "http://127.0.0.1:5000";


export async function fetchPatientById(patientId) {
  const token = await getIdToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${BASE_URL}/patients/${patientId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to load patient");
  }

  return res.json();
}