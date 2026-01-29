import { useEffect, useState } from "react";
import { fetchHospitalProfile, fetchPatients } from "../api/dashboard";
import NewPatient from "./NewPatient";
import PatientDashboard from "./PatientDashboard";
import { logout } from "../utils/auth";

export default function Dashboard() {
  const [hospital, setHospital] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // 🔍 Search
  const [mobileQuery, setMobileQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // ⌨️ Keyboard navigation
  const [activeIndex, setActiveIndex] = useState(-1);

  // ➕ New Patient toggle
  const [showNewPatient, setShowNewPatient] = useState(false);

  // ===============================
  // 🔄 LOAD DASHBOARD DATA
  // ===============================
  useEffect(() => {
    async function load() {
      try {
        const hospitalData = await fetchHospitalProfile();
        const patientData = await fetchPatients();
        setHospital(hospitalData);
        setPatients(patientData.patients || []);
      } catch (err) {
        setError(err.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ===============================
  // 🔍 LOCAL MOBILE SEARCH
  // ===============================
  useEffect(() => {
    if (mobileQuery.length < 3) {
      setSearchResults([]);
      setActiveIndex(-1);
      return;
    }

    const q = mobileQuery.replace(/\D/g, "");

    const matches = patients.filter((p) => {
      if (!p.primary_mobile) return false;

      let mobile = p.primary_mobile.replace(/\D/g, "");
      if (mobile.startsWith("91")) mobile = mobile.slice(2);

      return mobile.includes(q);
    });

    setSearchResults(matches);
    setActiveIndex(-1);
  }, [mobileQuery, patients]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // ===============================
  // 👉 PAGE 4: PATIENT DASHBOARD
  // ===============================
  if (selectedPatientId) {
    return (
      <PatientDashboard
        patientId={selectedPatientId}
        onBack={() => setSelectedPatientId(null)}
      />
    );
  }

  // ===============================
  // ➕ NEW PATIENT FORM
  // ===============================
  if (showNewPatient) {
    return (
      <NewPatient
        onCancel={() => setShowNewPatient(false)}
        onCreated={(patientId) => {
          alert(`Patient created: ${patientId}`);
          setShowNewPatient(false);
        }}
      />
    );
  }

  // ===============================
  // 📊 DASHBOARD VIEW
  // ===============================
  return (
    <div style={{ padding: 40, maxWidth: 700 }}>
      {/* ===== TOP BAR ===== */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h2>{hospital.name}</h2>
          <p>{hospital.address}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </div>

      <hr />

      {/* ===== SEARCH ===== */}
      <h3>Search Patient</h3>

      <input
        placeholder="Enter patient mobile number"
        value={mobileQuery}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9+]/g, "");
          setMobileQuery(val);
        }}
        onKeyDown={(e) => {
          if (searchResults.length === 0) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) =>
              i < searchResults.length - 1 ? i + 1 : 0
            );
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) =>
              i > 0 ? i - 1 : searchResults.length - 1
            );
          }

          if (e.key === "Enter" && activeIndex >= 0) {
            const p = searchResults[activeIndex];
            setSelectedPatientId(p.patient_id);
            setMobileQuery("");
            setSearchResults([]);
            setActiveIndex(-1);
          }

          if (e.key === "Escape") {
            setSearchResults([]);
            setActiveIndex(-1);
          }
        }}
        style={{ width: "100%", padding: 8 }}
      />

      {/* ===== SEARCH DROPDOWN ===== */}
      {mobileQuery.length >= 3 && (
        <div
          style={{
            border: "1px solid #ccc",
            marginTop: 4,
            borderRadius: 4,
            background: "#fff",
          }}
        >
          {searchResults.length === 0 && (
            <p style={{ padding: 8 }}>No matching patient</p>
          )}

          {searchResults.map((p, index) => (
            <div
              key={p.patient_id}
              style={{
                padding: 10,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                background:
                  index === activeIndex ? "#f0f0f0" : "#fff",
              }}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                setSelectedPatientId(p.patient_id);
                setMobileQuery("");
                setSearchResults([]);
                setActiveIndex(-1);
              }}
            >
              <div>
                <strong>{p.name}</strong> — Age {p.age}
              </div>
              <div>Mobile: {p.primary_mobile}</div>
              <div>ID: {p.patient_id}</div>
            </div>
          ))}
        </div>
      )}

      <hr />

      {/* ===== RECENT PATIENTS ===== */}
      <h3>Recent Patients</h3>

      <ul>
        {patients.map((p) => (
          <li
            key={p.patient_id}
            style={{ cursor: "pointer", marginBottom: 10 }}
            onClick={() => setSelectedPatientId(p.patient_id)}
          >
            <strong>{p.name}</strong> — Age {p.age}
            <br />
            Mobile: {p.primary_mobile}
            <br />
            ID: {p.patient_id}
          </li>
        ))}
      </ul>

      <hr />

      <button onClick={() => setShowNewPatient(true)}>
        + Add New Patient
      </button>
    </div>
  );
}