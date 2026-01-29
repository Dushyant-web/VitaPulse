import { apiFetch } from "./api.js";

/* ===============================
   🔐 AUTH GUARD
=============================== */
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  }
});

/* ===============================
   🌍 DUPLICATE STATE
=============================== */
let duplicateMatches = [];

/* ===============================
   🧠 SOFT DUPLICATE CHECK
=============================== */
async function checkDuplicateHint() {
  const nameEl = document.getElementById("name");
  const ageEl = document.getElementById("age");
  const hintEl = document.getElementById("duplicateHint");

  if (!nameEl || !ageEl || !hintEl) return;

  const name = nameEl.value.trim();
  const age = ageEl.value.trim();

  if (!name || !age) {
    hintEl.innerHTML = "";
    duplicateMatches = [];
    return;
  }

  try {
    const res = await apiFetch(
      `/patients/duplicate-check?name=${encodeURIComponent(name)}&age=${age}`
    );

    duplicateMatches = res.matches || [];

    if (duplicateMatches.length > 0) {
      hintEl.innerHTML = `
        ⚠️ Possible existing patients with same name & age:
        <ul>
          ${duplicateMatches
            .map(
              p =>
                `<li>${p.name} (Age ${p.age}) — ${p.primary_mobile || "No mobile"}</li>`
            )
            .join("")}
        </ul>
      `;
    } else {
      hintEl.innerHTML = "";
    }
  } catch {
    hintEl.innerHTML = "";
  }
}

/* ===============================
   🔔 ATTACH INPUT LISTENERS
=============================== */
["name", "age"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", checkDuplicateHint);
});

/* ===============================
   ➕ CREATE PATIENT
=============================== */
document.getElementById("patientForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // ⚠️ STRONG WARNING ON SAVE
  if (duplicateMatches.length > 0) {
    const ok = confirm(
      `⚠️ ${duplicateMatches.length} similar patient(s) found.\n\n` +
      `This may be a duplicate.\n\nDo you want to continue anyway?`
    );
    if (!ok) return;
  }

  const payload = {
    name: document.getElementById("name").value.trim(),
    age: Number(document.getElementById("age").value),
    gender: Number(document.getElementById("gender").value),
    primary_mobile: document.getElementById("mobile").value.trim(),
    patient_email: document.getElementById("patientEmail").value.trim() || null,
    guardian_email: document.getElementById("guardianEmail").value.trim() || null
  };

  try {
    // ✅ CREATE ONCE
    const res = await apiFetch("/patients", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    alert("Patient created successfully");

    // ✅ REDIRECT TO PATIENT DASHBOARD
    window.location.href = `patient.html?patient_id=${res.patient_id}`;

  } catch (err) {
    alert(err.message || "Failed to create patient");
  }
});