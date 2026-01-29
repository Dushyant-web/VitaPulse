export default function TimelineHeader({ patient }) {
  return (
    <div>
      <h2>{patient.name}</h2>
      <p>Gender: {patient.gender}</p>
    </div>
  );
}