import { apiFetch } from "./api.js";

let isPredictionMode = true;
let patientId = null;
let patientProfile = null;


firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return (window.location.href = "login.html");
  initPage();
});


async function initPage() {
  patientId = new URLSearchParams(window.location.search).get("patient_id");
  if (!patientId) return alert("Patient ID missing");

  await loadPatientProfile();
  setupBMIListener();
  setupFormSubmit();
}


async function loadPatientProfile() {
  const data = await apiFetch(`/patients/${patientId}`);
  patientProfile = data;

  document.getElementById("patientName").innerText = data.name ?? "—";
  document.getElementById("patientId").innerText = patientId;
  document.getElementById("age").value = data.age;
  document.getElementById("gender").value = data.gender === 1 ? "Male" : "Female";
}

function setupBMIListener() {
  const w = document.querySelector("[name='weight']");
  const h = document.querySelector("[name='height']");
  const bmi = document.getElementById("bmiPreview");

  const calc = () => {
    if (!w.value || !h.value) return (bmi.value = "");
    bmi.value = (w.value / Math.pow(h.value / 100, 2)).toFixed(1);
  };

  w.oninput = calc;
  h.oninput = calc;
}

function setupFormSubmit() {
  document.getElementById("recordForm").onsubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = buildPayload(e.target);

      const result = await apiFetch(`/predict`, {
        method: "POST",
        body: JSON.stringify({
          patient_id: patientId,
          ...payload,
          save: false,
        }),
      });

      showPrediction(result);
    } catch (err) {
      console.error(err);
      alert("❌ Prediction failed");
    }
  };
}

function buildPayload(form) {
  const fd = new FormData(form);
  const cb = (n) => (fd.get(n) ? 1 : 0);

  const input = {
    age: patientProfile.age,
    gender: patientProfile.gender,
    weight: Number(fd.get("weight")),
    height: Number(fd.get("height")),
    ap_hi: Number(fd.get("ap_hi")),
    ap_lo: Number(fd.get("ap_lo")),
    cholesterol: Number(fd.get("cholesterol")),
    gluc: Number(fd.get("gluc")),
    smoke: cb("smoke"),
    alco: cb("alco"),
    active: cb("active"),
    chest_pain: fd.get("chest_pain"),
    nausea: cb("nausea"),
    palpitations: cb("palpitations"),
    dizziness: fd.get("dizziness"),
  };

  let ecg = null;

  const hasECG =
    fd.get("heart_rate") ||
    fd.get("pr_interval_ms") ||
    fd.get("qrs_duration_ms") ||
    fd.get("qt_interval_ms") ||
    fd.get("arrhythmia_detected");

  if (hasECG) {
    ecg = {
      heart_rate: fd.get("heart_rate")
        ? Number(fd.get("heart_rate"))
        : undefined,
      pr_interval_ms: fd.get("pr_interval_ms")
        ? Number(fd.get("pr_interval_ms"))
        : undefined,
      qrs_duration_ms: fd.get("qrs_duration_ms")
        ? Number(fd.get("qrs_duration_ms"))
        : undefined,
      qt_interval_ms: fd.get("qt_interval_ms")
        ? Number(fd.get("qt_interval_ms"))
        : undefined,
      arrhythmia_detected: !!fd.get("arrhythmia_detected"),
    };
  }

  return {
    input,
    ecg,
    doctor_notes: {
      text: fd.get("doctor_note") || null,
    },
  };
}

function showPrediction(r) {
  document.getElementById("recordForm").style.display = "none";
  document.getElementById("predictionBox").style.display = "block";

  document.getElementById("predRisk").innerText = r.risk_level;
  document.getElementById("predProb").innerText = Math.round(r.probability * 100);
  document.getElementById("predConfidence").innerText = r.confidence ?? "—";
  document.getElementById("predExplain").innerText =
    r.human_explanation || r.explanation || "—";

  renderTopFactors(r.top_factors);
  fill("predSymptoms", r.symptom_insights);
  fill(
    "predWhatIf",
    r.what_if,
    (w) => `${w.change} → ${Math.round(w.new_probability * 100)}%`
  );

  document.getElementById("repredictBtn").onclick = () => {
    document.getElementById("predictionBox").style.display = "none";
    document.getElementById("recordForm").style.display = "block";
  };

  document.getElementById("saveBtn").onclick = async () => {
    await apiFetch(`/predict`, {
      method: "POST",
      body: JSON.stringify({
        patient_id: patientId,
        save: true,
        ...buildPayload(document.getElementById("recordForm")),
      }),
    });

    window.location.href = `patient.html?patient_id=${patientId}`;
  };
}

function fill(id, arr = [], map = (x) =>
  x.feature ? `${x.feature} — ${x.importance}` : x
) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  arr.forEach((v) => {
    const li = document.createElement("li");
    li.innerText = map(v);
    el.appendChild(li);
  });
}


function renderTopFactors(factors = []) {
  const el = document.getElementById("predFactors");
  el.innerHTML = "";

  if (!factors.length) {
    el.innerHTML = "<p style='opacity:.6'>No dominant risk factors</p>";
    return;
  }

  factors.slice(0, 3).forEach(f => {
    const score = f.score;

    const color =
      score > 70 ? "red" :
      score > 40 ? "orange" :
      "green";

    const row = document.createElement("div");
    row.className = "factor-row";

    row.innerHTML = `
      <span>${f.label}</span>
      <div class="bar">
        <div class="fill ${color}" style="width:${score}%"></div>
      </div>
    `;

    el.appendChild(row);
  });
}