import {
  apiFetch,
  fetchPatients,
  searchPatient,
  logout
} from "./api.js";

let masterPatients = [];   // always clean (non-deleted)
let allPatients = [];      // filtered / visible
let activeFilter = null; // total | today | week | deleted
let patientsChart = null;
let pendingDeletePatientId = null;
let chartRange = "week"; // "week" | "month"
let fullDailyCounts = [];
let searchResults = null;


firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const profile = await apiFetch("/auth/me");

    document.getElementById("hospitalName").innerText = profile.name;
    document.getElementById("hospitalEmail").innerText = profile.email;

    await loadRecentPatients();
    await loadAnalytics();
  } catch (err) {
    console.error(err);
    alert("Session expired. Please login again.");
    await firebase.auth().signOut();
    window.location.href = "login.html";
  }
});


async function loadRecentPatients() {
  const listEl = document.getElementById("patientsList");
  listEl.innerHTML = "<li>Loading patients...</li>";

  const res = await fetchPatients();

  // RAW DATA — may include deleted
  masterPatients = res.patients || [];

  // DEFAULT VIEW = NON-DELETED ONLY
  activeFilter = null;
  allPatients = masterPatients.filter(p => !p.is_deleted);

  applyActiveFilter();
}

function applyActiveFilter() {
  const listEl = document.getElementById("patientsList");
  listEl.innerHTML = "";

  const source = searchResults ?? masterPatients;
  let filtered = [];

  if (activeFilter === "deleted") {
    filtered = source.filter(p => p.is_deleted === true);
  } else if (activeFilter === "today") {
    const today = new Date().toISOString().slice(0, 10);
    filtered = source.filter(
      p =>
        !p.is_deleted &&
        p.created_at &&
        new Date(p.created_at).toISOString().slice(0, 10) === today
    );
  } else if (activeFilter === "week") {
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);

    filtered = source.filter(
      p => !p.is_deleted && p.created_at && new Date(p.created_at) >= last7
    );
  } else {
    filtered = source.filter(p => !p.is_deleted);
  }

  if (!filtered.length) {
    listEl.innerHTML = "<li>No patients found</li>";
    return;
  }

  filtered.forEach(renderPatientCard);
}


document.getElementById("searchInput").addEventListener("keyup", async (e) => {
  const query = e.target.value.trim();

  //  If cleared → restore normal view
  if (query.length === 0) {
    searchResults = null;
    applyActiveFilter();
    return;
  }

  // avoid spam
  if (query.length < 3) return;

  try {
    const res = await searchPatient(query);
    searchResults = res.patients || [];
    applyActiveFilter();
  } catch (err) {
    console.error("Search failed", err);
  }
});


function renderPatientCard(p) {
  const listEl = document.getElementById("patientsList");
  const template = document.getElementById("patient-card-template");

  const clone = template.content.cloneNode(true);
  const li = clone.querySelector(".patient-card");

  // Fill data
  li.querySelector(".patient-name").innerText = p.name;
  li.querySelector(".patient-age").innerText = p.age;
  li.querySelector(".patient-mobile").innerText = p.primary_mobile;
  li.querySelector(".patient-id").innerText = p.patient_id;

  
// DELETED PATIENT UI GUARD
if (p.is_deleted === true || p.name === "DELETED_PATIENT") {
  li.classList.add("deleted");

  // Block card navigation
  li.addEventListener("click", (e) => {
    e.stopPropagation();
    alert("This patient has been deleted.");
  });

  // Hide action buttons completely
  li.querySelector(".new-record")?.remove();
  li.querySelector(".delete-patient")?.remove();

  // Hide mobile (PII wiped anyway)
  const mobileEl = li.querySelector(".patient-mobile");
  if (mobileEl) {
    mobileEl.innerText = "—";
  }

  // Add DELETED badge
  const badge = document.createElement("div");
  badge.innerText = "DELETED";
  badge.className = "deleted-badge";
  li.querySelector(".patient-info").appendChild(badge);


  listEl.appendChild(li);
  return;
}
  /*  CARD CLICK → PATIENT DASHBOARD */
  li.addEventListener("click", () => {
    window.location.href = `patient.html?patient_id=${p.patient_id}`;
  });



  /*  NEW RECORD */
  li.querySelector(".new-record").addEventListener("click", (e) => {
    e.stopPropagation();
    window.location.href = `new-record.html?patient_id=${p.patient_id}`;
  });

li.querySelector(".delete-patient").addEventListener("click", (e) => {
  e.stopPropagation();
  pendingDeletePatientId = p.patient_id;
  document.getElementById("deletePassword").value = "";
  document.getElementById("deleteModal").classList.remove("hidden");
});

  listEl.appendChild(li);
}


document.getElementById("addPatientBtn").addEventListener("click", () => {
  window.location.href = "new_patient.html";
});


document.getElementById("logoutBtn").addEventListener("click", async () => {
  await logout();
});



async function loadAnalytics() {
  try {
    const res = await apiFetch("/dashboard/analytics");

    document.getElementById("totalPatients").innerText =
      res.total_patients ?? 0;
    document.getElementById("newToday").innerText =
      res.new_today ?? 0;
    document.getElementById("newLast7").innerText =
      res.new_last_7_days ?? 0;
    document.getElementById("deletedPatients").innerText =
      res.deleted_patients ?? 0;

    //  STORE FULL DATA (NO SLICING HERE)
    fullDailyCounts = res.daily_counts || [];

    // SINGLE render entry point
    renderPatientsChart(getChartData());

  } catch (err) {
    console.error("Failed to load analytics", err);
  }
}

function getChartData() {
  console.log("Chart range:", chartRange);

  if (chartRange === "month") {
    return fullDailyCounts.slice(-30);
  }

  return fullDailyCounts.slice(-7);
}


const analyticsEl = document.getElementById("analyticsCards");
if (analyticsEl) {
  analyticsEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-type]");
    if (!card) return;

    document
      .querySelectorAll("#analyticsCards .analytics-card")
      .forEach(c => c.classList.remove("active"));

    const type = card.dataset.type;

    // toggle list filter
    if (activeFilter === type) {
      activeFilter = null;
    } else {
      card.classList.add("active");
      activeFilter = type;
    }

    //  CORRECT chart range mapping
    switch (type) {
      case "today":
      case "week":
        chartRange = "week";
        break;

      case "total":
      case "deleted":
      default:
        chartRange = "month";
        break;
    }

    renderPatientsChart(getChartData());
    applyActiveFilter();
  });
}  


function renderPatientsChart(dailyCounts = []) {
  const canvas = document.getElementById("patientsChart");
  if (!canvas) return;

  const labels = dailyCounts.map(d => d.date);
  const values = dailyCounts.map(d => d.count);

  if (patientsChart) {
    patientsChart.destroy();
  }

  patientsChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: values,
        borderWidth: 2,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
  console.log("Chart range:", chartRange);
  console.log("Points:", dailyCounts.length);
}

const source = searchResults ?? masterPatients;
document.getElementById("exportCsvBtn")?.addEventListener("click", () => {
  let data = [];

  if (activeFilter === "deleted") {
    data = source.filter(p => p.is_deleted);
  } else {
    data = source.filter(p => !p.is_deleted);
  }

  exportToCSV(data);
});

function exportToCSV(patients) {
  if (!patients.length) {
    alert("No data to export");
    return;
  }

  const headers = [
    "Patient ID",
    "Name",
    "Age",
    "Gender",
    "Mobile",
    "Created At",
    "Deleted",
    "Deleted At"
  ];

  const rows = patients.map(p => [
    p.patient_id,
    p.name,
    p.age,
    p.gender,
    p.primary_mobile || "",
    p.created_at ? new Date(p.created_at).toISOString() : "",
    p.is_deleted ? "YES" : "NO",
    p.deleted_at ? new Date(p.deleted_at).toISOString() : ""
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach(r => {
    csv += r.map(v => `"${v}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `patients_${Date.now()}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

document.getElementById("cancelDelete").onclick = () => {
  pendingDeletePatientId = null;
  document.getElementById("deleteModal").classList.add("hidden");
};

document.getElementById("confirmDelete").onclick = async () => {
  const password = document.getElementById("deletePassword").value;
  if (!password || !pendingDeletePatientId) return;

  try {
    const user = firebase.auth().currentUser;
    const cred = firebase.auth.EmailAuthProvider.credential(
      user.email,
      password
    );

    await user.reauthenticateWithCredential(cred);

    await apiFetch(`/patients/${pendingDeletePatientId}/soft-delete`, {
      method: "POST"
    });

    alert("Patient deleted successfully");
    pendingDeletePatientId = null;
    document.getElementById("deleteModal").classList.add("hidden");
    await loadRecentPatients();

  } catch (err) {
    alert("Invalid password");
  }
};