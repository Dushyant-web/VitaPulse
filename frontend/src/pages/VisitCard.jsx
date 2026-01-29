import { useState } from "react";
import DoctorNote from "../components/DoctorNote";

export default function VisitCard({ visit, index, patientId }) {
  const [open, setOpen] = useState(false);

  // =========================================
  // 🕒 ROBUST TIMESTAMP RESOLUTION
  // =========================================
  const resolveTimestamp = () => {
    const ts = visit.date || visit.created_at;
    if (!ts) return null;

    if (ts.seconds) return ts.seconds * 1000;
    if (ts._seconds) return ts._seconds * 1000;

    const parsed = Date.parse(ts);
    if (!isNaN(parsed)) return parsed;

    return null;
  };

  const timestampMs = resolveTimestamp();

  const formattedDate = timestampMs
    ? new Date(timestampMs).toLocaleString("en-IN", {
        dateStyle: "long",
        timeStyle: "medium",
      })
    : "Unknown time";

  // =========================================
  // 🫀 ECG FLAGS
  // =========================================
  const ecgFlags = visit.ecg_flags;
  const hasECGFlags =
    ecgFlags && Array.isArray(ecgFlags.flags) && ecgFlags.flags.length > 0;

  // =========================================
  // 🧠 ECG → RISK DELTA
  // =========================================
  const ecgRiskDelta = visit.ecg_risk_delta;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        marginBottom: 12,
        background: "#fafafa",
        cursor: "pointer",
      }}
      onClick={() => setOpen(!open)}
    >
      {/* ===== HEADER ===== */}
      <div style={{ padding: 14 }}>
        <strong>
          Entry_{index + 1} ({formattedDate})
        </strong>

        <div style={{ marginTop: 6 }}>
          Risk: {visit.risk?.risk_level || "—"}{" "}
          {visit.risk?.probability != null &&
            `(${Math.round(visit.risk.probability * 100)}%)`}
        </div>
      </div>

      {/* ===== DETAILS ===== */}
      {open && (
        <div
          style={{
            padding: 14,
            borderTop: "1px solid #ddd",
            background: "#fff",
          }}
        >
          {/* ===== VITALS ===== */}
          <h4>Vitals</h4>
          <div>BP: {visit.vitals?.ap_hi}/{visit.vitals?.ap_lo}</div>
          <div>BMI: {visit.vitals?.bmi}</div>
          <div>Weight: {visit.vitals?.weight}</div>

          {/* ===== LIFESTYLE ===== */}
          <h4>Lifestyle</h4>
          <div>Smoking: {visit.lifestyle?.smoke ? "Yes" : "No"}</div>
          <div>Alcohol: {visit.lifestyle?.alco ? "Yes" : "No"}</div>
          <div>Active: {visit.lifestyle?.active ? "Yes" : "No"}</div>

          {/* ===== SYMPTOMS ===== */}
          <h4>Symptoms</h4>
          <div>Chest Pain: {visit.symptoms?.chest_pain}</div>
          <div>Nausea: {visit.symptoms?.nausea ? "Yes" : "No"}</div>
          <div>Palpitations: {visit.symptoms?.palpitations ? "Yes" : "No"}</div>
          <div>Dizziness: {visit.symptoms?.dizziness}</div>

          {/* ===== ECG ===== */}
          {visit.ecg && (
            <>
              <h4>ECG</h4>
              <div>Heart Rate: {visit.ecg.heart_rate}</div>
              <div>PR Interval: {visit.ecg.pr_interval_ms} ms</div>
              <div>QRS Duration: {visit.ecg.qrs_duration_ms} ms</div>
              <div>QT Interval: {visit.ecg.qt_interval_ms} ms</div>
              <div>
                Arrhythmia:{" "}
                {visit.ecg.arrhythmia_detected ? "Detected" : "No"}
              </div>
            </>
          )}

          {/* ===== ECG FLAGS ===== */}
          <h4>ECG Assessment</h4>

          {!ecgFlags && (
            <div style={{ color: "#777" }}>
              ECG not recorded for this visit.
            </div>
          )}

          {ecgFlags && (
            <>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 12,
                  fontSize: 13,
                  marginBottom: 6,
                  background:
                    ecgFlags.status === "abnormal"
                      ? "#ffe5e5"
                      : "#e6f7ee",
                  color:
                    ecgFlags.status === "abnormal"
                      ? "#b30000"
                      : "#0a7a4a",
                }}
              >
                {ecgFlags.status === "abnormal"
                  ? "⚠ Abnormal ECG"
                  : ecgFlags.status === "normal"
                  ? "✓ Normal ECG"
                  : "ECG Not Recorded"}
              </div>

              {hasECGFlags && (
                <ul style={{ marginTop: 6 }}>
                  {ecgFlags.flags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* ===== ECG → RISK DELTA ===== */}
          {ecgRiskDelta && (
            <>
              <h4>ECG Impact on Risk</h4>

              <div>
                Risk Delta:{" "}
                <strong
                  style={{
                    color:
                      ecgRiskDelta.delta > 0
                        ? "red"
                        : ecgRiskDelta.delta < 0
                        ? "green"
                        : "#555",
                  }}
                >
                  {ecgRiskDelta.delta > 0 && "+"}
                  {ecgRiskDelta.delta}%
                </strong>
              </div>

              {ecgRiskDelta.reasons?.length > 0 && (
                <ul style={{ marginTop: 6 }}>
                  {ecgRiskDelta.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* ===== 📝 DOCTOR NOTE (READ-ONLY) ===== */}
          <DoctorNote doctorNotes={visit.doctor_notes} />
        </div>
      )}
    </div>
  );
}