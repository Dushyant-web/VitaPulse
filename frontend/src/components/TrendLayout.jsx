export default function TrendLayout({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}