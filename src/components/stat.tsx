export default function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "brand" | "warn" | "success";
}) {
  const valueCls =
    accent === "warn"
      ? "stat__value stat__value--warn"
      : accent === "success"
      ? "stat__value stat__value--success"
      : "stat__value";
  return (
    <div className={accent === "brand" ? "card card--brand" : "card"}>
      <p className="eyebrow">{label}</p>
      <p className={valueCls}>{value}</p>
      {sub && <p className="muted stat__sub">{sub}</p>}
    </div>
  );
}
