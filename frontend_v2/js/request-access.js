document
  .getElementById("hospitalRequestForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const payload = {
      hospital_name: document.getElementById("hospital_name").value,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      license_number: document.getElementById("license_number").value,
      hospital_type: document.getElementById("hospital_type").value,
      intended_use: document.getElementById("intended_use").value,
      patient_volume: document.getElementById("patient_volume").value,
      justification: document.getElementById("justification").value
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/hospital-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const statusEl = document.getElementById("statusMessage");

      if (res.ok) {
        statusEl.style.color = "green";
        statusEl.innerText =
          "Your request has been recorded. Our team will review it within 24 hours.";
        document.getElementById("hospitalRequestForm").reset();
      } else {
        statusEl.style.color = "red";
        statusEl.innerText = data.error || "Submission failed";
      }
    } catch (err) {
      statusEl.innerText = "Server error. Please try again later.";
    }
  });

async function reject(id) {
  if (!confirm("Reject this hospital request?")) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/admin/hospital-requests/${id}/reject`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Reject failed");

    alert("❌ Request rejected");
    loadRequests();

  } catch (err) {
    alert(err.message);
  }
}