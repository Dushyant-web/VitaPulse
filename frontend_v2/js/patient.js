import { apiFetch } from "./api.js";

/* ===============================
   🔐 AUTH GUARD
=============================== */
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  await loadPatientPage();
});

function getPrediction(e) {
  return e.prediction ?? {
    risk_level: e.risk_level ?? "—",
    probability: e.probability ?? 0
  };
}

/* ===============================
   🌍 GLOBAL STATE
=============================== */
let originalTimeline = [];
let currentTimeline = [];
let openBody = null;

/* ===============================
   📌 LOAD PAGE
=============================== */

async function loadPatientPage() {
  const params = new URLSearchParams(window.location.search);
  const patientId = params.get("patient_id");
  if (!patientId) return alert("Patient ID missing");

  let data;
  try {
    data = await apiFetch(`/patients/${patientId}/timeline`);
  } catch {
    alert("Patient not found or access denied");
    window.location.href = "dashboard.html";
    return;
  }

  /* =====================================================
     🔐 FRONTEND GUARD — BLOCK DELETED PATIENT
     ===================================================== */
  if (
    data.patient?.is_deleted === true ||
    data.patient?.name === "DELETED_PATIENT"
  ) {
    alert("This patient has been deleted and cannot be accessed.");
    window.location.href = "dashboard.html";
    return;
  }

  /* =====================================================
     ✅ NORMAL FLOW (UNCHANGED)
     ===================================================== */
  renderPatientHeader(data.patient);
  renderHealthSummary(data.summary);
  setupOutcomeCheckbox(data.patient);

  originalTimeline = data.timeline || [];
  currentTimeline = [...originalTimeline];

  sortTimeline("desc"); // default latest first
}

/* ===============================
   👤 HEADER (FIXED)
=============================== */
function renderPatientHeader(p) {
  const genderMap = {
    0: "Female",
    1: "Male",
  };

  document.getElementById("patientName").innerText = p.name ?? "—";
  document.getElementById("patientId").innerText = p.patient_id ?? "—";
  document.getElementById("patientAge").innerText = p.age ?? "—";
  document.getElementById("patientGender").innerText =
    genderMap[p.gender] ?? p.gender ?? "—";

  // SAFE OPTIONAL FIELDS
  document.getElementById("patientMobile").innerText =
    p.primary_mobile ?? "Not available";
  document.getElementById("patientEmail").innerText =
    p.patient_email ?? "Not available";
  document.getElementById("guardianEmail").innerText =
    p.guardian_email ?? "Not available";
}

/* ===============================
   ❤️ SUMMARY
=============================== */
function renderHealthSummary(s) {
  document.getElementById("healthScore").innerText = s.health_score;
  document.getElementById("currentRisk").innerText = s.latest_risk_level;
  document.getElementById("latestProbability").innerText =
    Math.round(s.latest_probability * 100);
  document.getElementById("totalVisits").innerText = s.records_count;
  document.getElementById("riskTrend").innerText =
    `${s.trend.status} (Δ ${s.trend.delta})`;
}

/* ===============================
   🔃 SORT
=============================== */
function getTimestamp(e) {
  if (e.date?.seconds) return e.date.seconds * 1000;
  return new Date(e.date).getTime();
}

function sortTimeline(order) {
  currentTimeline.sort((a, b) =>
    order === "desc"
      ? getTimestamp(b) - getTimestamp(a)
      : getTimestamp(a) - getTimestamp(b)
  );
  renderTimeline(currentTimeline);
}

/* ===============================
   🕒 TIMELINE
=============================== */
function renderTimeline(timeline) {
  const container = document.getElementById("timeline");
  container.innerHTML = "";
  openBody = null;

  if (!timeline.length) {
    container.innerHTML = "<p>No visits recorded.</p>";
    return;
  }

  timeline.forEach((e) => {
    const card = document.createElement("div");
    card.className = "visit-card";

    const body = document.createElement("div");
    body.className = "visit-body";
    body.style.display = "none";

    const date = new Date(getTimestamp(e)).toLocaleString();

    const p = getPrediction(e);

    const badgeClass =
      p.risk_level === "High"
        ? "high"
        : p.risk_level === "Medium"
        ? "medium"
        : "low";

    const header = document.createElement("div");
    header.className = "visit-header";
    header.innerHTML = `
      <div>${date}</div>
      <span class="badge ${badgeClass}">
        ${p.risk_level} (${Math.round(p.probability * 100)}%)
      </span>
    `;  

    // 🗑 DELETE BUTTON
    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "🗑 Delete";
    deleteBtn.className = "delete-record-btn";
      
    // prevent accordion toggle
    deleteBtn.onclick = async (ev) => {
      ev.stopPropagation();
    
      const ok = confirm(
        "⚠️ Permanently delete this visit?\nThis cannot be undone."
      );
      if (!ok) return;
    
      try {
        const patientId = new URLSearchParams(
          window.location.search
        ).get("patient_id");
      
        await apiFetch(
          `/patients/${patientId}/records/${e.record_id}`,
          { method: "DELETE" }
        );
      
        // remove from UI
        card.remove();
      
      } catch {
        alert("Failed to delete record");
      }
    };
    
    header.appendChild(deleteBtn);

    header.onclick = () => {
      if (openBody && openBody !== body) openBody.style.display = "none";
      body.style.display = body.style.display === "block" ? "none" : "block";
      openBody = body.style.display === "block" ? body : null;
    };

    body.innerHTML = `
      <div class="section">
        <h4>Vitals</h4>
        BP: ${e.vitals.ap_hi}/${e.vitals.ap_lo}<br/>
        BMI: ${e.vitals.bmi}<br/>
        Weight: ${e.vitals.weight}
      </div>

      <div class="section">
        <h4>Lifestyle</h4>
        Smoking: ${e.lifestyle.smoke ? "Yes" : "No"}<br/>
        Alcohol: ${e.lifestyle.alco ? "Yes" : "No"}<br/>
        Active: ${e.lifestyle.active ? "Yes" : "No"}
      </div>

      <div class="section">
        <h4>Symptoms</h4>
        Chest Pain: ${e.symptoms.chest_pain}<br/>
        Nausea: ${e.symptoms.nausea ? "Yes" : "No"}<br/>
        Palpitations: ${e.symptoms.palpitations ? "Yes" : "No"}<br/>
        Dizziness: ${e.symptoms.dizziness}
      </div>

      <div class="section">
        <h4>ECG</h4>
        ${
          e.ecg
            ? `
              HR: ${e.ecg.heart_rate}<br/>
              PR: ${e.ecg.pr_interval_ms} ms<br/>
              QRS: ${e.ecg.qrs_duration_ms} ms<br/>
              QT: ${e.ecg.qt_interval_ms} ms<br/>
              Arrhythmia: ${e.ecg.arrhythmia_detected ? "Detected" : "No"}
            `
            : "ECG not recorded"
        }
      </div>

      <div class="section">
        <h4>Prediction</h4>
          ${(() => {
          const p = getPrediction(e);
          return `
            Risk Level: <b>${p.risk_level}</b><br/>
            Probability: <b>${Math.round(p.probability * 100)}%</b>
          `;
        })()}
      </div>

      ${
        e.derived?.human_explanation
          ? `
        <div class="section">
          <h4>Why this risk?</h4>
          <p>${e.derived.human_explanation}</p>
        </div>`
          : ""
      }

      ${
        Array.isArray(e.symptom_insights) && e.symptom_insights.length
          ? `
        <div class="section">
          <h4>Symptom Insights</h4>
          <ul>${e.symptom_insights.map(s => `<li>${s}</li>`).join("")}</ul>
        </div>`
          : ""
      }

      ${
        Array.isArray(e.top_factors) && e.top_factors.length
          ? `
        <div class="section">
          <h4>Top Risk Factors</h4>
          <ul>
            ${e.top_factors
              .map(f => `<li>${f.feature} (${Math.round(f.importance * 100)}%)</li>`)
              .join("")}
          </ul>
        </div>`
          : ""
      }

      ${
        Array.isArray(e.what_if) && e.what_if.length
          ? `
        <div class="section">
          <h4>What-If Analysis</h4>
          <ul>
            ${e.what_if
              .map(
                w =>
                  `<li>${w.change} → New Risk: ${Math.round(
                    w.new_probability * 100
                  )}%</li>`
              )
              .join("")}
          </ul>
        </div>`
          : ""
      }

      <div class="section">
        <h4>Doctor Notes</h4>
        ${e.doctor_notes?.text || "No doctor note recorded"}
      </div>
    `;

    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);
  });
}


/* ===============================
   🎛 CONTROLS
=============================== */
document.getElementById("sortOrder").addEventListener("change", e => {
  sortTimeline(e.target.value);
});

document.getElementById("riskFilter").addEventListener("change", e => {
  const val = e.target.value;
  currentTimeline =
    val === "ALL"
      ? [...originalTimeline]
      :originalTimeline.filter(v => {
      const p = getPrediction(v);
      return p.risk_level === val;
    });      
  renderTimeline(currentTimeline);
});

document.getElementById("backBtn").onclick = () => history.back();

/* ===============================
   📄 DOWNLOAD PDF (BACKEND)
=============================== */
document.getElementById("downloadPdfBtn")?.addEventListener("click", async () => {
  try {
    const patientId = new URLSearchParams(window.location.search).get("patient_id");
    const token = await firebase.auth().currentUser.getIdToken();

    const res = await fetch(
      `http://127.0.0.1:5000/patients/${patientId}/report/pdf`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Patient_${patientId}_Report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    alert("PDF download failed");
  }
});

/* ===============================
   📧 SEND REPORT VIA EMAIL
=============================== */
document.getElementById("sendEmailBtn")?.addEventListener("click", async () => {
  try {
    const patientId = new URLSearchParams(window.location.search).get("patient_id");
    const token = await firebase.auth().currentUser.getIdToken();

    const sendPatient = confirm("Send report to patient email?");
    const sendGuardian = confirm("Send report to guardian email?");
    if (!sendPatient && !sendGuardian) return;

    const res = await fetch(
      `http://127.0.0.1:5000/patients/${patientId}/report/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          send_to_patient: sendPatient,
          send_to_guardian: sendGuardian,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error();
    alert(`Report sent to:\n${data.sent_to.join("\n")}`);
  } catch {
    alert("Failed to send email");
  }
});

/* ===============================
   📈 OPEN TRENDS PAGE
=============================== */
document.getElementById("trendsBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const params = new URLSearchParams(window.location.search);
  const patientId = params.get("patient_id");

  if (!patientId) {
    alert("Patient ID missing");
    return;
  }

  window.location.href = `trends.html?patient_id=${patientId}`;
});

/* ===============================
   ➕ NEW RECORD
=============================== */
document.getElementById("newRecordBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const patientId = new URLSearchParams(window.location.search).get("patient_id");
  if (!patientId) {
    alert("Patient ID missing");
    return;
  }

  window.location.href = `new-record.html?patient_id=${patientId}`;
});

async function setupOutcomeCheckbox(patient) {
  const cb = document.getElementById("cardiacArrestCheckbox");
  if (!cb) return; // ✅ SAFETY GUARD

  // If already marked → lock UI
  if (patient.outcome?.cardiac_arrest === 1) {
    cb.checked = true;
    cb.disabled = true;
    cb.title = "Outcome locked";
    return;
  }

  cb.onchange = async () => {
    if (!cb.checked) return;

    const confirmLock = confirm(
      "⚠️ This action is irreversible.\nMark cardiac arrest permanently?"
    );

    if (!confirmLock) {
      cb.checked = false;
      return;
    }

    try {
      await apiFetch(`/patients/${patient.patient_id}/outcome`, {
        method: "POST",
        body: JSON.stringify({ cardiac_arrest: 1 })
      });

      cb.checked = true;
      cb.disabled = true;
      alert("Outcome saved and locked");

    } catch {
      cb.checked = false;
      alert("Failed to save outcome");
    }
  };
}

document.getElementById("editPatientBtn")?.addEventListener("click", () => {
  const patientId = new URLSearchParams(window.location.search).get("patient_id");
  if (!patientId) return;
  window.location.href = `edit-patient.html?patient_id=${patientId}`;
});