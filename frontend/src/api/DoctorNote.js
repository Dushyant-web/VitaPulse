import { getIdToken } from "/src/utils/token.js";

const BASE_URL = "http://127.0.0.1:5000";

/**
 * GET doctor note (read-only)
 */
export async function getDoctorNote(patientId, recordId) {
  const token = await getIdToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(
    `${BASE_URL}/patients/${patientId}/records/${recordId}/notes`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch note");

  return data.doctor_notes;
}

/**
 * ADD doctor note (once, locked)
 */
export async function addDoctorNote(patientId, recordId, text) {
  const token = await getIdToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(
    `${BASE_URL}/patients/${patientId}/records/${recordId}/notes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add note");

  return data;
}

/**
 * EDIT doctor note (within lock window)
 */
export async function updateDoctorNote(patientId, recordId, text) {
  const token = await getIdToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(
    `${BASE_URL}/patients/${patientId}/records/${recordId}/notes`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update note");

  return data;
}