export const BASE_URL = "http://127.0.0.1:5000";

//Firebase Token
async function getIdToken() {
  const user = firebase.auth().currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

//Fetch Wrapper
export async function apiFetch(endpoint, options = {}) {
  const token = await getIdToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "API error");
  }

  return res.json();
}

//Hospital Profile
export function fetchHospitalProfile() {
  return apiFetch("/auth/me");
}

//Fetch Patients
export function fetchPatients() {
  return apiFetch("/patients");
}

//Search patient
export function searchPatient(query) {
  return apiFetch(`/patients/search?q=${encodeURIComponent(query)}`);
}

//Logout
export async function logout() {
  await firebase.auth().signOut();
  window.location.href = "login.html";
}