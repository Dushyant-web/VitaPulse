import { useState } from "react";
import { createPatient } from "../api/patient";

export default function NewPatient({ onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [primaryMobile, setPrimaryMobile] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!primaryMobile || primaryMobile.length < 10) {
      setError("Valid patient or guardian mobile number is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        age: Number(age),
        gender: Number(gender),
        primary_mobile: primaryMobile,
        patient_email: patientEmail || null,
        guardian_email: guardianEmail || null,
      };

      const res = await createPatient(payload);

      if (onCreated) onCreated(res.patient_id);
    } catch (err) {
      setError(err.message || "Failed to create patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 500 }}>
      <h2>Add New Patient</h2>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <input
          placeholder="Patient Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />

        {/* Age */}
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />

        {/* Gender */}
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        >
          <option value="">Select Gender</option>
          <option value="1">Male</option>
          <option value="2">Female</option>
        </select>

        {/* Primary Mobile */}
        <input
          type="tel"
          placeholder="Patient / Guardian Mobile Number"
          value={primaryMobile}
          onChange={(e) => setPrimaryMobile(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />

        {/* Emails (optional) */}
        <input
          type="email"
          placeholder="Patient Email (optional)"
          value={patientEmail}
          onChange={(e) => setPatientEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          type="email"
          placeholder="Guardian Email (optional)"
          value={guardianEmail}
          onChange={(e) => setGuardianEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 20 }}
        />

        {/* Actions */}
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Patient"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={{ marginLeft: 10 }}
        >
          Cancel
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
    </div>
  );
}