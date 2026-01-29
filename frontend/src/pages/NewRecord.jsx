import { useState } from "react";
import { predictAndSave } from "../api/predict";

export default function NewRecord({ patient, onCancel, onCreated }) {
  // ===============================
  // 🔒 AUTO-FILLED
  // ===============================
  const [age] = useState(patient.age);
  const [gender] = useState(patient.gender);

  // ===============================
  // 📊 VITALS
  // ===============================
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [apHi, setApHi] = useState("");
  const [apLo, setApLo] = useState("");
  const [cholesterol, setCholesterol] = useState("");
  const [glucose, setGlucose] = useState("");

  // ===============================
  // 🧍 LIFESTYLE
  // ===============================
  const [smoke, setSmoke] = useState(0);
  const [alco, setAlco] = useState(0);
  const [active, setActive] = useState(1);

  // ===============================
  // ⚠️ SYMPTOMS
  // ===============================
  const [chestPain, setChestPain] = useState("none");
  const [nausea, setNausea] = useState(0);
  const [palpitations, setPalpitations] = useState(0);
  const [dizziness, setDizziness] = useState("no");

  // ===============================
  // 🫀 ECG (OPTIONAL)
  // ===============================
  const [heartRate, setHeartRate] = useState("");
  const [prInterval, setPrInterval] = useState("");
  const [qrsDuration, setQrsDuration] = useState("");
  const [qtInterval, setQtInterval] = useState("");
  const [arrhythmia, setArrhythmia] = useState(false);

  // ===============================
  // 📝 DOCTOR NOTE
  // ===============================
  const [doctorNote, setDoctorNote] = useState("");

  // ===============================
  // ✅ OUTCOME CONFIRMATION (ADDED)
  // ===============================
  const [cardiacArrest, setCardiacArrest] = useState(false);

  // ===============================
  // 🔁 RESULT STATE
  // ===============================
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===============================
  // ✅ VALIDATION
  // ===============================
  const validate = () => {
    if (!height || !weight || !apHi || !apLo || !cholesterol || !glucose) {
      return "All vitals are required";
    }
    return null;
  };

  // ===============================
  // 🔮 SUBMIT
  // ===============================
  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const hasECG =
        heartRate || prInterval || qrsDuration || qtInterval || arrhythmia;

      const payload = {
        patient_id: patient.patient_id,

        input: {
          age,
          gender,
          height: Number(height),
          weight: Number(weight),
          ap_hi: Number(apHi),
          ap_lo: Number(apLo),
          cholesterol: Number(cholesterol),
          gluc: Number(glucose),
          smoke,
          alco,
          active,
          chest_pain: chestPain,
          nausea,
          palpitations,
          dizziness,
        },

        ecg: hasECG
          ? {
              heart_rate: heartRate ? Number(heartRate) : null,
              pr_interval_ms: prInterval ? Number(prInterval) : null,
              qrs_duration_ms: qrsDuration ? Number(qrsDuration) : null,
              qt_interval_ms: qtInterval ? Number(qtInterval) : null,
              arrhythmia_detected: Boolean(arrhythmia),
            }
          : null,

        // ✅ DOCTOR NOTE
        doctor_note: doctorNote.trim() || null,

        // ✅ OUTCOME SENT TO BACKEND (ADDED)
        outcome: {
          cardiac_arrest: cardiacArrest ? 1 : 0,
          confirmed_by: "doctor",
        },
      };

      const response = await predictAndSave(payload);
      setResult(response);
    } catch (err) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <h2>New Patient Record</h2>

      <p><strong>Patient:</strong> {patient.name}</p>
      <p><strong>Patient ID:</strong> {patient.patient_id}</p>

      <input value={`Age: ${age}`} disabled />
      <input value={`Gender: ${gender}`} disabled />

      <h3>Vitals</h3>
      <input placeholder="Height (cm)" value={height} onChange={e => setHeight(e.target.value)} />
      <input placeholder="Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} />
      <input placeholder="Systolic BP" value={apHi} onChange={e => setApHi(e.target.value)} />
      <input placeholder="Diastolic BP" value={apLo} onChange={e => setApLo(e.target.value)} />
      <input placeholder="Cholesterol (1–3)" value={cholesterol} onChange={e => setCholesterol(e.target.value)} />
      <input placeholder="Glucose (1–3)" value={glucose} onChange={e => setGlucose(e.target.value)} />

      <h3>Lifestyle</h3>
      <select value={smoke} onChange={e => setSmoke(Number(e.target.value))}>
        <option value={0}>Non-smoker</option>
        <option value={1}>Smoker</option>
      </select>

      <select value={alco} onChange={e => setAlco(Number(e.target.value))}>
        <option value={0}>No Alcohol</option>
        <option value={1}>Alcohol</option>
      </select>

      <select value={active} onChange={e => setActive(Number(e.target.value))}>
        <option value={1}>Active</option>
        <option value={0}>Inactive</option>
      </select>

      <h3>Symptoms</h3>
      <select value={chestPain} onChange={e => setChestPain(e.target.value)}>
        <option value="none">Chest Pain: None</option>
        <option value="mild">Chest Pain: Mild</option>
        <option value="moderate">Chest Pain: Moderate</option>
        <option value="severe">Chest Pain: Severe</option>
      </select>

      <select value={nausea} onChange={e => setNausea(Number(e.target.value))}>
        <option value={0}>Nausea: No</option>
        <option value={1}>Nausea: Yes</option>
      </select>

      <select value={palpitations} onChange={e => setPalpitations(Number(e.target.value))}>
        <option value={0}>Palpitations: No</option>
        <option value={1}>Palpitations: Yes</option>
      </select>

      <select value={dizziness} onChange={e => setDizziness(e.target.value)}>
        <option value="no">Dizziness: No</option>
        <option value="mild">Dizziness: Mild</option>
        <option value="severe">Dizziness: Severe</option>
      </select>

      <h3>ECG (Optional)</h3>
      <input placeholder="Heart Rate" value={heartRate} onChange={e => setHeartRate(e.target.value)} />
      <input placeholder="PR Interval (ms)" value={prInterval} onChange={e => setPrInterval(e.target.value)} />
      <input placeholder="QRS Duration (ms)" value={qrsDuration} onChange={e => setQrsDuration(e.target.value)} />
      <input placeholder="QT Interval (ms)" value={qtInterval} onChange={e => setQtInterval(e.target.value)} />

      <label>
        <input type="checkbox" checked={arrhythmia} onChange={() => setArrhythmia(!arrhythmia)} />
        Arrhythmia Detected
      </label>

      {/* ===============================
          🩺 OUTCOME CONFIRMATION (ADDED)
         =============================== */}
      <h3>Outcome (Doctor Confirmation)</h3>
      <label>
        <input
          type="checkbox"
          checked={cardiacArrest}
          onChange={() => setCardiacArrest(!cardiacArrest)}
        />
        Cardiac Arrest Occurred
      </label>

      {/* ===============================
          📝 DOCTOR NOTE
         =============================== */}
      <h3>Doctor Note (Optional)</h3>
      <textarea
        placeholder="Doctor assessment / remarks (cannot be edited later)"
        value={doctorNote}
        onChange={e => setDoctorNote(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
      />

      <hr />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Predicting..." : "Predict & Save"}
      </button>

      <button onClick={onCancel} style={{ marginLeft: 10 }}>
        Back
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <>
          <hr />
          <h2>Prediction Result</h2>

          <p><strong>Risk:</strong> {result.risk_level}</p>
          <p><strong>Probability:</strong> {Math.round(result.probability * 100)}%</p>
          <p><strong>Confidence:</strong> {result.confidence}</p>

          <h3>Explanation</h3>
          <p>{result.explanation}</p>

          <h3>Top Factors</h3>
          <ul>
            {result.top_factors.map((f, i) => (
              <li key={i}>{f.feature} — {f.importance}</li>
            ))}
          </ul>

          <h3>Symptom Insights</h3>
          <ul>
            {result.symptom_insights.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h3>What If</h3>
          <ul>
            {result.what_if.map((w, i) => (
              <li key={i}>{w.change} → {Math.round(w.new_probability * 100)}%</li>
            ))}
          </ul>

          <button onClick={onCreated}>
            Save & Return to Patient
          </button>
        </>
      )}
    </div>
  );
}