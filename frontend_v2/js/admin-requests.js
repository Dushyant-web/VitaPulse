const listDiv = document.getElementById("list");
const errorEl = document.getElementById("error");
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "admin-login.html";
}

let currentStatus = "pending";

// ===============================
// LOAD REQUESTS BY STATUS
// ===============================
async function loadByStatus(status) {
  currentStatus = status;
  listDiv.innerHTML = "Loading...";
  errorEl.innerText = "";

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/admin/hospital-requests?status=${status}`,
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");

    renderRequests(data.requests, status);

  } catch (err) {
    errorEl.innerText = err.message;
  }
}

// ===============================
// RENDER REQUESTS
// ===============================
function renderRequests(requests, status) {
  listDiv.innerHTML = "";

  if (!requests || requests.length === 0) {
    listDiv.innerHTML = `<p>No ${status} requests</p>`;
    return;
  }

  requests.forEach(req => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <h3>${req.hospital_name}</h3>
      <p><b>Email:</b> ${req.email}</p>
      <p><b>Hospital Type:</b> ${req.hospital_type}</p>
      <p><b>Intended Use:</b> ${req.intended_use}</p>
      <p><b>License:</b> ${req.license_number}</p>

      <p><b>Justification:</b></p>
      <p style="background:#f5f5f5;padding:8px;">
        ${req.justification}
      </p>

      ${status === "pending" ? `
        <button onclick="approve('${req.request_id}')">✅ Approve</button>
        <button onclick="reject('${req.request_id}')" 
          style="margin-left:10px;background:#ff4d4d;color:white;">
          ❌ Reject
        </button>
      ` : `
        <p><b>Status:</b> ${status.toUpperCase()}</p>
      `}
    `;

    listDiv.appendChild(div);
  });
}

// ===============================
// APPROVE
// ===============================
async function approve(id) {
  if (!confirm("Approve this hospital?")) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/admin/hospital-requests/${id}/approve`,
      {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Approval failed");

    alert("✅ Hospital approved");
    loadByStatus(currentStatus);

  } catch (err) {
    alert(err.message);
  }
}

// ===============================
// REJECT
// ===============================
async function reject(id) {
  if (!confirm("Reject this hospital?")) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/admin/hospital-requests/${id}/reject`,
      {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Reject failed");

    alert("❌ Request rejected");
    loadByStatus(currentStatus);

  } catch (err) {
    alert(err.message);
  }
}

// DEFAULT LOAD
loadByStatus("pending");

async function loadStats() {
  try {
    const res = await fetch(
      "http://127.0.0.1:5000/admin/stats",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Stats failed");

    document.getElementById("stats").innerHTML = `
      <div>🕒 Pending: <b>${data.pending}</b></div>
      <div>✅ Approved: <b>${data.approved}</b></div>
      <div>❌ Rejected: <b>${data.rejected}</b></div>
      <div>🏥 Hospitals: <b>${data.hospitals}</b></div>
    `;

  } catch (err) {
    console.error("Stats error:", err);
  }
}

loadStats();