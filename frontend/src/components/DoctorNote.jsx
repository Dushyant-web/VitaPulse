export default function DoctorNote({ doctorNotes }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h4>Doctor Notes</h4>

      {!doctorNotes && (
        <div style={{ color: "#777" }}>
          No doctor note recorded for this visit.
        </div>
      )}

      {doctorNotes?.text && (
        <div
          style={{
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "#f9f9f9",
            whiteSpace: "pre-wrap",
          }}
        >
          {doctorNotes.text}
        </div>
      )}
    </div>
  );
}