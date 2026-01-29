export default function TrendStatusBanner({ trend, latestProbability }) {
  if (!trend || !trend.status) return null;

  const status = trend.status;

  const config = {
    improving: {
      label: "Improving",
      color: "#0a7a4a",
      bg: "#e6f7ee",
      icon: "📉",
      text: "Overall cardiovascular risk is decreasing over time.",
    },
    stable: {
      label: "Stable",
      color: "#a36a00",
      bg: "#fff4e5",
      icon: "➖",
      text: "No significant change in cardiovascular risk.",
    },
    worsening: {
      label: "Worsening",
      color: "#b30000",
      bg: "#ffe5e5",
      icon: "📈",
      text: "Cardiovascular risk is increasing over time.",
    },
    insufficient_data: {
      label: "Insufficient Data",
      color: "#555",
      bg: "#f0f0f0",
      icon: "ℹ️",
      text: "Not enough visits to determine a trend.",
    },
  };

  const cfg = config[status] || config.insufficient_data;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        marginBottom: 20,
        background: cfg.bg,
        border: `1px solid ${cfg.color}`,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, color: cfg.color }}>
        {cfg.icon} Trend: {cfg.label}
      </div>

      <p style={{ marginTop: 6, marginBottom: 6 }}>{cfg.text}</p>

      {latestProbability != null && (
        <div style={{ fontSize: 14, color: "#333" }}>
          Latest Risk Probability:{" "}
          <strong>{Math.round(latestProbability * 100)}%</strong>
        </div>
      )}
    </div>
  );
}