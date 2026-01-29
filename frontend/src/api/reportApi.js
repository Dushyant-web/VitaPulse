import { getIdToken } from "../utils/token";

const BASE_URL = "http://127.0.0.1:5000";

export async function downloadPatientPDF(patientId) {
  const token = await getIdToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(
    `${BASE_URL}/patients/${patientId}/report/pdf`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to download PDF");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${patientId}_report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function sendPatientPDF(patientId, options) {
  const token = await getIdToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(
    `${BASE_URL}/patients/${patientId}/send-report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send report");

  return data;
}