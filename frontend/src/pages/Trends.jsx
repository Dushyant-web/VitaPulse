import { useEffect, useState } from "react";
import { getIdToken } from "../utils/token";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import TrendStatusBanner from "../components/TrendStatusBanner";

const BASE_URL = "http://127.0.0.1:5000";

export default function Trends({ patientId, onBack }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ STEP 6 — METRIC TOGGLES
  const [showRisk, setShowRisk] = useState(true);
  const [showECG, setShowECG] = useState(true);
  const [showBP, setShowBP] = useState(true);
  const [showBMI, setShowBMI] = useState(true);

  // ===============================
  // 📥 LOAD TIMELINE
  // ===============================
  useEffect(() => {
    async function load() {
      try {
        const token = await getIdToken();
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(
          `${BASE_URL}/patients/${patientId}/timeline`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to load trends");

        const json = await res.json();

        setSummary(json.summary || null);

        // 🔄 TRANSFORM → GRAPH FRIENDLY
        const formatted = (json.timeline || []).map((v, i) => ({
          index: i + 1,
          date: v.date?.seconds
            ? new Date(v.date.seconds * 1000).toLocaleDateString("en-IN")
            : "—",

          probability:
            v.risk?.probability != null
              ? Math.round(v.risk.probability * 100)
              : null,

          // ✅ STEP 6 — ECG RISK DELTA OVERLAY
          ecgDelta: v.ecg_risk_delta?.delta || 0,

          systolic: v.vitals?.ap_hi,
          diastolic: v.vitals?.ap_lo,
          bmi: v.vitals?.bmi,
        }));

        setData(formatted);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [patientId]);

  if (loading) return <p>Loading trends…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 40, maxWidth: 1000 }}>
      <button onClick={onBack}>← Back</button>

      {/* ✅ TREND STATUS (UNCHANGED) */}
      <TrendStatusBanner
        trend={summary?.trend}
        latestProbability={summary?.latest_probability}
      />

      <h2 style={{ marginTop: 10 }}>📈 Health Trends</h2>
      <p style={{ color: "#555" }}>
        Key health indicators plotted over time.
      </p>

      {/* ✅ STEP 6 — TOGGLE CONTROLS */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <label>
          <input
            type="checkbox"
            checked={showRisk}
            onChange={() => setShowRisk(!showRisk)}
          />{" "}
          Risk %
        </label>

        <label>
          <input
            type="checkbox"
            checked={showECG}
            onChange={() => setShowECG(!showECG)}
          />{" "}
          ECG Impact
        </label>

        <label>
          <input
            type="checkbox"
            checked={showBP}
            onChange={() => setShowBP(!showBP)}
          />{" "}
          Blood Pressure
        </label>

        <label>
          <input
            type="checkbox"
            checked={showBMI}
            onChange={() => setShowBMI(!showBMI)}
          />{" "}
          BMI
        </label>
      </div>

      <hr />

      {/* ===============================
          📊 RISK + ECG OVERLAY
         =============================== */}
      {showRisk && (
        <>
          <h3>Risk Probability (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="probability"
                stroke="#d32f2f"
                strokeWidth={3}
                dot
                name="Risk %"
              />

              {/* ✅ ECG RISK DELTA OVERLAY */}
              {showECG && (
                <Line
                  type="monotone"
                  dataKey="ecgDelta"
                  stroke="#ff9800"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="ECG Impact (%)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          <hr />
        </>
      )}

      {/* ===============================
          ❤️ BLOOD PRESSURE
         =============================== */}
      {showBP && (
        <>
          <h3>Blood Pressure</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#1976d2"
                strokeWidth={2}
                name="Systolic"
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#388e3c"
                strokeWidth={2}
                name="Diastolic"
              />
            </LineChart>
          </ResponsiveContainer>
          <hr />
        </>
      )}

      {/* ===============================
          ⚖️ BMI
         =============================== */}
      {showBMI && (
        <>
          <h3>BMI Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="bmi"
                stroke="#6a1b9a"
                strokeWidth={2}
                name="BMI"
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}