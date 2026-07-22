import NutzerClient from "./nutzer-client";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminNutzerPage() {
  await requireAdminPage();
  return (
    <div className="page page--narrow">
      <p className="eyebrow">Verwaltung</p>
      <h1>Nutzer</h1>
      <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a className="navlink" href="/admin">Admin</a>
        <a className="navlink" href="/editor">Editor</a>
        <a className="navlink navlink--active" href="/admin/nutzer">Nutzer</a>
        <a className="navlink" href="/admin/einstellungen">Einstellungen</a>
      </div>
      <div className="card">
        <NutzerClient />
      </div>
    </div>
  );
}
