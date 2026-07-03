import NutzerClient from "./nutzer-client";

export default function AdminNutzerPage() {
  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Verwaltung</p>
      <h1>Nutzer</h1>
      <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a className="navlink" href="/admin">Fragen</a>
        <a className="navlink" href="/admin/nutzer" style={{ fontWeight: 600 }}>Nutzer</a>
      </div>
      <div className="card">
        <NutzerClient />
      </div>
    </div>
  );
}
