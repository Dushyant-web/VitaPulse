import ECGBlock from "./ECGBlock";

export default function TimelineItem({ item }) {
  return (
    <div>
      <p>Date: {item.date}</p>
      <p>Risk: {item.risk.risk_level} ({item.risk.probability})</p>
      <p>BP: {item.vitals.ap_hi}/{item.vitals.ap_lo}</p>
      <p>BMI: {item.vitals.bmi}</p>

      {item.ecg && <ECGBlock ecg={item.ecg} />}
    </div>
  );
}