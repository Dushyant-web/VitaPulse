import { apiFetch } from "./api.js";

/* ===============================
   🔐 AUTH GUARD
=============================== */
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await loadPatient();
});

/* ===============================
   🌍 STATE
=============================== */
let originalData = {};
let isDirty = false;

/* ===============================
   📌 LOAD PATIENT
=============================== */
async function loadPatient() {
  const params = new URLSearchParams(window.location.search);
  const patientId = params.get("patient_id");
  if (!patientId) {
    alert("Patient ID missing");
    return;
  }

  const data = await apiFetch(`/patients/${patientId}`);

  // 🚫 Deleted patient guard
  if (data.is_deleted === true || data.name === "DELETED_PATIENT") {
    alert("This patient has been deleted and cannot be edited.");
    history.back();
    return;
  }

  // 🔹 Fill form
  document.getElementById("name").value = data.name || "";
  document.getElementById("age").value = data.age ?? "";
  document.getElementById("gender").value = data.gender ?? 1;
  document.getElementById("patientEmail").value = data.patient_email || "";
  document.getElementById("guardianEmail").value = data.guardian_email || "";

  // 📌 Store original snapshot
  originalData = {
    name: document.getElementById("name").value,
    age: document.getElementById("age").value,
    gender: document.getElementById("gender").value,
    patientEmail: document.getElementById("patientEmail").value,
    guardianEmail: document.getElementById("guardianEmail").value
  };

  setupDirtyTracking();
  updateSaveButton();
}

/* ===============================
   🧠 DIRTY TRACKING
=============================== */
function setupDirtyTracking() {
  const fields = [
    "name",
    "age",
    "gender",
    "patientEmail",
    "guardianEmail"
  ];

  fields.forEach(id => {
    document.getElementById(id).addEventListener("input", checkDirty);
    document.getElementById(id).addEventListener("change", checkDirty);
  });
}

function checkDirty() {
  isDirty =
    document.getElementById("name").value !== originalData.name ||
    document.getElementById("age").value !== originalData.age ||
    document.getElementById("gender").value !== originalData.gender ||
    document.getElementById("patientEmail").value !== originalData.patientEmail ||
    document.getElementById("guardianEmail").value !== originalData.guardianEmail;

  updateSaveButton();
}

function updateSaveButton() {
  const btn = document.querySelector("button[type='submit']");
  if (btn) btn.disabled = !isDirty;
}

/* ===============================
   ⚠️ UNSAVED CHANGES WARNING
=============================== */
window.addEventListener("beforeunload", (e) => {
  if (!isDirty) return;
  e.preventDefault();
  e.returnValue = "";
});

/* ===============================
   💾 SAVE CHANGES (PARTIAL UPDATE)
=============================== */
document
  .getElementById("editPatientForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patient_id");

    const payload = {};

    const name = document.getElementById("name").value.trim();
    const ageVal = document.getElementById("age").value;
    const genderVal = document.getElementById("gender").value;
    const patientEmail = document.getElementById("patientEmail").value.trim();
    const guardianEmail = document.getElementById("guardianEmail").value.trim();

    if (name !== originalData.name) payload.name = name;
    if (ageVal !== originalData.age && ageVal !== "") payload.age = Number(ageVal);
    if (genderVal !== originalData.gender) payload.gender = Number(genderVal);

    payload.patient_email = patientEmail || null;
    payload.guardian_email = guardianEmail || null;

    if (Object.keys(payload).length === 0) {
      alert("No changes to save");
      return;
    }

    try {
      await apiFetch(`/patients/${patientId}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      alert("Patient updated successfully");

      // ✅ reset dirty state
      isDirty = false;
      originalData = {
        name,
        age: ageVal,
        gender: genderVal,
        patientEmail,
        guardianEmail
      };
      updateSaveButton();

    } catch (err) {
      alert(err.message || "Failed to update patient");
    }
  });

/* ===============================
   ❌ CANCEL (WITH WARNING)
=============================== */
document.getElementById("cancelBtn").onclick = () => {
  if (isDirty) {
    const ok = confirm("You have unsaved changes. Discard them?");
    if (!ok) return;
  }
  history.back();
};