export default function VisitDetails({ record }) {
  return (
    <div style={{ marginTop: 10, paddingLeft: 10 }}>
      <div><strong>Confidence:</strong> {record.confidence}</div>

      <h4>Vitals</h4>
      <div>BP: {record.vitals.ap_hi}/{record.vitals.ap_lo}</div>
      <div>BMI: {record.vitals.bmi}</div>
      <div>Weight: {record.vitals.weight}</div>

      {record.ecg && (
        <>
          <h4>ECG</h4>
          <div>Heart Rate: {record.ecg.heart_rate}</div>
          <div>QT Interval: {record.ecg.qt_interval}</div>
        </>
      )}

      {record.doctor_note && (
        <>
          <h4>Doctor Note</h4>
          <div>{record.doctor_note}</div>
        </>
      )}
    </div>
  );
}