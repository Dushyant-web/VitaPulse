import { apiFetch } from "./api.js";

let riskChart, bpChart, bmiChart;

/* ===============================
   🔴🟡 RISK ZONES
=============================== */
const riskBandsPlugin = {
  id: "riskBands",
  beforeDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;

    const y = scales.y;
    const left = chartArea.left;
    const right = chartArea.right;

    // 🔴 Danger >70%
    ctx.fillStyle = "rgba(255,0,0,0.08)";
    ctx.fillRect(
      left,
      y.getPixelForValue(100),
      right - left,
      y.getPixelForValue(70) - y.getPixelForValue(100)
    );

    // 🟡 Warning 40–70%
    ctx.fillStyle = "rgba(255,165,0,0.08)";
    ctx.fillRect(
      left,
      y.getPixelForValue(70),
      right - left,
      y.getPixelForValue(40) - y.getPixelForValue(70)
    );
  }
};

/* ===============================
   📍 LATEST VISIT MARKER
=============================== */
const latestVisitLinePlugin = {
  id: "latestVisitLine",
  afterDraw(chart) {
    const { ctx, chartArea, scales, data } = chart;
    if (!chartArea) return;

    const x = scales.x;
    const last = data.labels.length - 1;
    const xPos = x.getPixelForValue(last);

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPos, chartArea.top);
    ctx.lineTo(xPos, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  }
};

/* ===============================
   🔐 AUTH
=============================== */
firebase.auth().onAuthStateChanged(async user => {
  if (!user) return (window.location.href = "login.html");
  loadTrends();
});

async function loadTrends() {
  const patientId = new URLSearchParams(window.location.search).get("patient_id");
  if (!patientId) return alert("Patient ID missing");

  const data = await apiFetch(`/patients/${patientId}/timeline`);
  const timeline = data.timeline || [];

  if (timeline.length < 2) {
    document.getElementById("trendSummary").innerText =
      "Not enough visits to show trends.";
    return;
  }

  buildCharts(timeline, data.summary);
  setupToggles();
}

function ts(e) {
  return e.date?.seconds
    ? new Date(e.date.seconds * 1000).toLocaleDateString()
    : new Date(e.date).toLocaleDateString();
}

function buildCharts(timeline, summary) {
  const labels = timeline.map(ts);

  const risk = timeline.map(v => Math.round(v.risk.probability * 100));
  const ecgImpact = timeline.map(v =>
    Math.round((v.ecg_risk_delta?.delta || 0) * 100)
  );
  const doctorNotes = timeline.map(v => v.doctor_notes?.text || "No doctor note");

  const sys = timeline.map(v => v.vitals.ap_hi);
  const dia = timeline.map(v => v.vitals.ap_lo);

  // ✅ BMI DATA AS OBJECTS (IMPORTANT)
  const bmi = timeline.map(v => ({
    x: ts(v),
    y: v.vitals.bmi,
    height: v.vitals.height,
    weight: v.vitals.weight
  }));

  document.getElementById("trendSummary").innerText =
    `Trend: ${summary.trend.status} | Latest Risk: ${Math.round(
      summary.latest_probability * 100
    )}%`;

  /* ================= RISK ================= */
  riskChart = new Chart(document.getElementById("riskChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Risk %",
          data: risk,
          borderColor: "red",
          pointRadius: 4,
          pointHoverRadius: 7,
          tension: 0.4
        },
        {
          label: "ECG Impact %",
          data: ecgImpact,
          borderColor: "orange",
          borderDash: [5, 5],
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 0, max: 100 } },
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: items =>
              `Doctor Note: ${doctorNotes[items[0].dataIndex]}`
          }
        },
        legend: { position: "top" }
      }
    },
    plugins: [riskBandsPlugin, latestVisitLinePlugin]
  });

  /* ================= BP ================= */
  bpChart = new Chart(document.getElementById("bpChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Systolic", data: sys, borderColor: "blue", tension: 0.4 },
        { label: "Diastolic", data: dia, borderColor: "green", tension: 0.4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { suggestedMin: 60, suggestedMax: 200 } },
      plugins: { legend: { position: "top" } }
    }
  });

  /* ================= BMI ================= */
  bmiChart = new Chart(document.getElementById("bmiChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "BMI",
          data: bmi,
          borderColor: "purple",
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { suggestedMin: 15, suggestedMax: 40 } },
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label(ctx) {
              const p = ctx.raw;
              return [];
            },
            afterBody(ctx) {
              const p = ctx[0].raw;
              return [
                `BMI: ${p.y.toFixed(2)}`,
                `Height: ${p.height} cm`,
                `Weight: ${p.weight} kg`
              ];
            }
          }
        }
      }
    }
  });
}

/* ===============================
   ☑️ TOGGLES
=============================== */
function setupToggles() {
  toggle("toggleRisk", riskChart, 0);
  toggle("toggleECG", riskChart, 1);

  document.getElementById("toggleBP").onchange = e => {
    bpChart.data.datasets.forEach(d => (d.hidden = !e.target.checked));
    bpChart.update();
  };

  toggle("toggleBMI", bmiChart, 0);
}

function toggle(id, chart, index) {
  document.getElementById(id).onchange = e => {
    chart.data.datasets[index].hidden = !e.target.checked;
    chart.update();
  };
}