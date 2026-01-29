import { getIdToken } from "../utils/token";

const BASE_URL = "http://127.0.0.1:5000";

export async function fetchHospitalProfile() {
  const token = await getIdToken();

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Unauthorized");

  return res.json();
}