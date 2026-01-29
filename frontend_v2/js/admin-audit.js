const tableBody = document.getElementById("auditTable");
const errorEl = document.getElementById("error");

const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "admin-login.html";
}

// ===============================
// LOAD AUDIT LOGS
// ===============================
async function loadAuditLogs() {
  try {
    const res = await fetch(
      "http://127.0.0.1:5000/admin/audit-logs",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to load logs");

    renderLogs(data.logs);

  } catch (err) {
    errorEl.innerText = err.message;
  }
}

// ===============================
// RENDER TABLE
// ===============================
function renderLogs(logs) {
  tableBody.innerHTML = "";

  if (!logs || logs.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='4'>No audit logs found</td></tr>";
    return;
  }

  logs.forEach(log => {
    const row = document.createElement("tr");

    const actionClass =
      log.status === "approved" ? "approved" : "rejected";

    row.innerHTML = `
      <td class="${actionClass}">
        ${log.action.replace("_", " ")}
      </td>
      <td>${log.hospital_email}</td>
      <td>${log.admin_id}</td>
      <td>${formatDate(log.timestamp)}</td>
    `;

    tableBody.appendChild(row);
  });
}

// ===============================
// FORMAT FIRESTORE TIMESTAMP
// ===============================
function formatDate(ts) {
  if (!ts || !ts._seconds) return "-";
  const date = new Date(ts._seconds * 1000);
  return date.toLocaleString();
}

loadAuditLogs();