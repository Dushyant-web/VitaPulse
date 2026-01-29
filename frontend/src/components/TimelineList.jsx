import TimelineItem from "./TimelineItem";

export default function TimelineList({ timeline }) {
  return (
    <div>
      <h3>Health Timeline</h3>
      {timeline.map(item => (
        <TimelineItem key={item.record_id} item={item} />
      ))}
    </div>
  );
}