import VisitCard from "./VisitCard";

export default function VisitTimeline({ records }) {
  if (!records || records.length === 0) {
    return (
      <div style={{ marginTop: 30 }}>
        <h3>Visit Timeline</h3>
        <p>No visits recorded yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Visit Timeline</h3>

      {records.map((record, index) => (
        <VisitCard
          key={record.record_id}
          record={record}
          index={index}
        />
      ))}
    </div>
  );
}