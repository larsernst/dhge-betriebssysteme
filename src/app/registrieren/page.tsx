import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <div className="page page--narrow">
      <p className="eyebrow">Konto erstellen</p>
      <h1>Registrieren</h1>
      <p className="muted">
        Lege ein kostenloses Konto an, um deinen Lernfortschritt zu speichern und
        Spaced Repetition zu nutzen.
      </p>
      <div className="card">
        <RegisterForm />
      </div>
    </div>
  );
}