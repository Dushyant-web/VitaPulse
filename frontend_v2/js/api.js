export const BASE_URL = "http://127.0.0.1:5000";

// ===============================
// 🔑 GET FIREBASE ID TOKEN
// ===============================
async function getIdToken() {
  const user = firebase.auth().currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

// ===============================
// 📡 AUTH FETCH WRAPPER
// ===============================
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

// ===============================
// 🏥 HOSPITAL PROFILE
// ===============================
export function fetchHospitalProfile() {
  return apiFetch("/auth/me");
}

// ===============================
// 👥 FETCH PATIENTS
// ===============================
export function fetchPatients() {
  return apiFetch("/patients");
}

// ===============================
// 🔍 SEARCH PATIENT
// ===============================
export function searchPatient(query) {
  return apiFetch(`/patients/search?q=${encodeURIComponent(query)}`);
}

// ===============================
// 🚪 LOGOUT
// ===============================
export async function logout() {
  await firebase.auth().signOut();
  window.location.href = "login.html";
}