import { useEffect, useState } from "react";
import { fetchPatientById } from "../api/patientDetails";
import { getIdToken } from "../utils/token";

import HealthSummary from "./HealthSummary";
import NewRecord from "./NewRecord";
import VisitCard from "./VisitCard";
import Trends from "./Trends";

/* ✅ ADDED */
import ReportActions from "./ReportActions";

const BASE_URL = "http://127.0.0.1:5000";

export default function PatientDashboard({ patientId, onBack }) {
  const [patient, setPatient] = useState(null);
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [showTrends, setShowTrends] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===============================
  // 📥 LOAD PATIENT + TIMELINE
  // ===============================
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // 1️⃣ Patient profile
        const patientData = await fetchPatientById(patientId);
        setPatient(patientData);

        // 2️⃣ Auth token
        const token = await getIdToken();
        if (!token) throw new Error("Unauthorized");

        // 3️⃣ Timeline + Summary
        const res = await fetch(
          `${BASE_URL}/patients/${patientId}/timeline`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to load patient timeline");

        const data = await res.json();

        setSummary(data.summary || null);
        setTimeline(data.timeline || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load patient data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [patientId]);

  // ===============================
  // ⏳ LOADING / ERROR
  // ===============================
  if (loading) return <p>Loading patient...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // ===============================
  // ➕ NEW RECORD FLOW
  // ===============================
  if (showNewRecord) {
    return (
      <NewRecord
        patient={patient}
        onCancel={() => setShowNewRecord(false)}
        onCreated={() => {
          setShowNewRecord(false);
          window.location.reload(); // simple + safe refresh
        }}
      />
    );
  }

  if (showTrends) {
  return (
    <Trends
      patientId={patientId}
      onBack={() => setShowTrends(false)}
    />
  );
}

  // ===============================
  // 🧾 MAIN DASHBOARD
  // ===============================
  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      {/* ===== BACK ===== */}
      <button onClick={onBack}>← Back</button>

      {/* ===== PATIENT HEADER ===== */}
      <h2 style={{ marginTop: 10 }}>{patient.name}</h2>

      <p><strong>Patient ID:</strong> {patient.patient_id}</p>
      <p><strong>Age:</strong> {patient.age}</p>
      <p><strong>Gender:</strong> {patient.gender}</p>
      <p><strong>Mobile:</strong> {patient.primary_mobile}</p>
      <p><strong>Patient Email:</strong> {patient.patient_email || "—"}</p>
      <p><strong>Guardian Email:</strong> {patient.guardian_email || "—"}</p>

      <hr />

      {/* ===== HEALTH SUMMARY ===== */}
      <HealthSummary summary={summary} />

      <hr />

      {/* ✅ ADDED — PDF ACTIONS */}
      <ReportActions patientId={patientId} />

      <hr />

      {/* ===== ACTIONS ===== */}
      <button
        onClick={() => setShowNewRecord(true)}
        style={{
          padding: "10px 16px",
          background: "#000",
          color: "#fff",
          borderRadius: 6,
          cursor: "pointer",
        }}

        
      >
        ➕ New Record
      </button>

      <button
      onClick={() => setShowTrends(true)}
      style={{
        padding: "10px 16px",
        marginLeft: 10,
        background: "#1f2937",
        color: "#fff",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      📈 Trends
    </button>

      <hr />

      {/* ===== VISIT TIMELINE ===== */}
      <h3>Visit Timeline</h3>

      {timeline.length === 0 && <p>No visits recorded yet.</p>}

      {timeline.map((visit, idx) => (
        <VisitCard
          key={visit.record_id}
          visit={visit}
          index={idx}
          patientId={patientId}
        />
      ))}
    </div>
  );
}