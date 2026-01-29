export default function PatientHeader({ patient, onBack }) {
  return (
    <>
      <button onClick={onBack}>← Back</button>
      <h2 style={{ marginTop: 10 }}>{patient.name}</h2>
      <p>Patient ID: {patient.patient_id}</p>
      <hr />
    </>
  );
}