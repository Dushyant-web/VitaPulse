import { useEffect, useState } from "react";
import { fetchPatientTimeline } from "../api/timelineApi";

import TimelineHeader from "../components/TimelineHeader";
import RiskSummary from "../components/RiskSummary";
import TimelineList from "../components/TimelineList";

export default function PatientTimeline() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFjMzIxOTgzNGRhNTBlMjBmYWVhZWE3Yzg2Y2U3YjU1MzhmMTdiZTEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdml0YXB1bHNlLTk2MDZhIiwiYXVkIjoidml0YXB1bHNlLTk2MDZhIiwiYXV0aF90aW1lIjoxNzY5MjcxMDk5LCJ1c2VyX2lkIjoiQ0xlYjdNUUltclpLQ0V1anVFak9FN1NQT0J2MSIsInN1YiI6IkNMZWI3TVFJbXJaS0NFdWp1RWpPRTdTUE9CdjEiLCJpYXQiOjE3NjkyNzEwOTksImV4cCI6MTc2OTI3NDY5OSwiZW1haWwiOiJhZG1pbkBjaXR5aGVhcnQuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImFkbWluQGNpdHloZWFydC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.Tbg0-noB_AI4QExXyeaD5CYsjqtaOaXkaqYvzMrBwNGVZKCbYb7CGka2P2VdMVFFrXYMyGZV2tUSxpBRSFVm6rnL-8doirLblfweAIpgdGZ97FiqEHWOQp8XHtFrCouu4O4hY3EI9y1NUlcviqCtyKZLIJ4eKTLkAFnJSWFz2bBT6MaVSC2iH8COYQQYQERrzAboEFJs1f5f2RZm8DdrS_YuEsRuOkRvpdEGI9HNCLPTjjMsSv909kIeiNrCH7456MwR1EmO_2uPIi2k4YTvvCTqIawaMxiYtDKr4qML8KZzrjo6uVg3tq--SuxY1vlUrOvi3hwgLFQR1Z_xq8KjsQ"; // temp
    const patientId = "patient_001";

    fetchPatientTimeline(patientId, token)
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>Loading timeline...</p>;

  return (
    <div>
      <TimelineHeader patient={data.patient} />
      <RiskSummary summary={data.summary} />
      <TimelineList timeline={data.timeline} />
    </div>
  );
}