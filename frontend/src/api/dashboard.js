import { getIdToken } from "../utils/token";

const BASE_URL = "http://127.0.0.1:5000";

export async function fetchHospitalProfile() {
  const token = await getIdToken();
  if (!token) throw new Error("No auth token");

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load hospital");

  return res.json();
}

export async function fetchPatients() {
  const token = await getIdToken();
  if (!token) throw new Error("No auth token");

  const res = await fetch(`${BASE_URL}/patients`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load patients");

  return res.json();
}