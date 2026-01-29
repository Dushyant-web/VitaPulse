export default function HealthSummary({ summary }) {
  if (!summary) return null;

  const {
    health_score,
    latest_probability,
    latest_risk_level,
    trend,
    records_count,
  } = summary;

  // 🎨 Color logic
  let scoreColor = "#2e7d32"; // green
  if (health_score <= 40) scoreColor = "#c62828"; // red
  else if (health_score <= 70) scoreColor = "#ef6c00"; // orange

  let trendColor = "#555";
  if (trend?.status === "improving") trendColor = "#2e7d32";
  if (trend?.status === "worsening") trendColor = "#c62828";

  return (
    <div
      style={{
        border: "2px solid #222",
        padding: 20,
        marginBottom: 30,
        borderRadius: 8,
        background: "#fafafa",
      }}
    >
      <h3>Patient Health Summary</h3>

      {/* ================= HEALTH SCORE ================= */}
      <div style={{ marginBottom: 12 }}>
        <strong>Overall Health Score:</strong>{" "}
        <span
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: scoreColor,
          }}
        >
          {health_score ?? "—"} / 100
        </span>
      </div>

      {/* ================= RISK ================= */}
      <div>
        <strong>Current Risk Level:</strong>{" "}
        {latest_risk_level ?? "N/A"}
      </div>

      <div>
        <strong>Latest Probability:</strong>{" "}
        {latest_probability !== null
          ? `${Math.round(latest_probability * 100)}%`
          : "N/A"}
      </div>

      {/* ================= TREND ================= */}
      <div style={{ marginTop: 8 }}>
        <strong>Trend:</strong>{" "}
        <span style={{ color: trendColor }}>
          {trend?.status ?? "insufficient data"}
        </span>
        {trend?.delta !== null && (
          <> (Δ {trend.delta > 0 ? "+" : ""}{trend.delta})</>
        )}
      </div>

      {/* ================= META ================= */}
      <hr />

      <div>
        <strong>Total Recorded Visits:</strong> {records_count}
      </div>
    </div>
  );
}