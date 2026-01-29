export default function ECGBlock({ ecg }) {
  return (
    <div>
      <h4>ECG</h4>
      <p>Heart Rate: {ecg.heart_rate}</p>
      <p>PR Interval: {ecg.pr_interval_ms} ms</p>
      <p>QRS: {ecg.qrs_duration_ms} ms</p>
      <p>QT: {ecg.qt_interval_ms} ms</p>
      <p>Arrhythmia: {ecg.arrhythmia_detected ? "Yes" : "No"}</p>
    </div>
  );
}