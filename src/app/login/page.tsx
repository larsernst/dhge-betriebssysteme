import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="page page--narrow" style={{ paddingTop: 80 }}>
      <p className="eyebrow">Willkommen zurück</p>
      <h1>Anmelden</h1>
      <div className="card">
        <LoginForm />
      </div>
    </div>
  );
}