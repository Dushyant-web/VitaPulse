export async function fetchPatientTimeline(patientId, token) {
  const safePatientId = encodeURIComponent(patientId);

  const res = await fetch(
    `http://127.0.0.1:5000/patients/${safePatientId}/timeline`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch timeline: ${text}`);
  }

  return res.json();
}