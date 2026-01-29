export default function RiskSummary({ summary }) {
  return (
    <div>
      <h3>Overall Status</h3>
      <p>Latest Risk: {summary.latest_risk_level}</p>
      <p>Probability: {summary.latest_probability}</p>
      <p>Trend: {summary.trend.status}</p>
    </div>
  );
}