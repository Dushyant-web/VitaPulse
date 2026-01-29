import { getIdToken } from "../utils/token";

const BASE_URL = "http://127.0.0.1:5000";

export default function ReportActions({ patientId }) {
  // ===============================
  // 📄 DOWNLOAD PDF
  // ===============================
  const downloadPDF = async () => {
    try {
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

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `patient_${patientId}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "Failed to fetch PDF");
    }
  };

  // ===============================
  // 📧 SEND PDF
  // ===============================
  const sendPDF = async () => {
  try {
    const token = await getIdToken();
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(
      `${BASE_URL}/patients/${patientId}/report/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          send_to_patient: true,
          send_to_guardian: true,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to send PDF");
    }

    alert("PDF sent successfully");
  } catch (err) {
    alert(err.message || "Failed to send PDF");
  }
};

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <button onClick={downloadPDF}>📄 Download PDF</button>
      <button onClick={sendPDF}>📧 Send PDF</button>
    </div>
  );
}