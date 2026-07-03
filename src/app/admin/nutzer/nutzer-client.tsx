"use client";

import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "admin_token";

type User = {
  id: string;
  name: string;
  email: string;
  mcqEnabled: boolean;
  createdAt: string;
};

export default function NutzerClient() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) setUnlocked(true);
  }, []);

  function unlock(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (!t) {
      setError("Bitte Token eingeben.");
      return;
    }
    localStorage.setItem(TOKEN_KEY, t);
    setUnlocked(true);
    setError(null);
  }

  function lock() {
    localStorage.removeItem(TOKEN_KEY);
    setUnlocked(false);
    setToken("");
    setUsers([]);
  }

  function authHeaders(storedToken: string, json = false): Record<string, string> {
    const h: Record<string, string> = { Authorization: `Bearer ${storedToken}` };
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  const loadUsers = useCallback(async (q: string) => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setUnlocked(false);
      return;
    }
    setLoading(true);
    setError(null);
    const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
    const res = await fetch(url, { headers: authHeaders(storedToken) });
    setLoading(false);
    if (res.status === 401) {
      setUnlocked(false);
      setError("Token ungültig oder abgelaufen.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Nutzer konnten nicht geladen werden.");
      return;
    }
    const data = await res.json();
    setUsers(data.users as User[]);
  }, []);

  useEffect(() => {
    if (unlocked) loadUsers(query);
  }, [unlocked, query, loadUsers]);

  async function saveEdit(
    id: string,
    data: { name?: string; email?: string; mcqEnabled?: boolean }
  ) {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setUnlocked(false);
      return;
    }
    setSuccess(null);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: authHeaders(storedToken, true),
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      setUnlocked(false);
      setError("Token ungültig oder abgelaufen.");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setEditingId(null);
    setSuccess("Nutzer aktualisiert.");
    await loadUsers(query);
  }

  async function resetPassword(id: string, name: string, newPassword: string) {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setUnlocked(false);
      return;
    }
    setSuccess(null);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: authHeaders(storedToken, true),
      body: JSON.stringify({ userId: id, newPassword }),
    });
    if (res.status === 401) {
      setUnlocked(false);
      setError("Token ungültig oder abgelaufen.");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Passwort konnte nicht zurückgesetzt werden.");
      return;
    }
    setSuccess(`Passwort für „${name}" zurückgesetzt.`);
  }

  async function removeUser(user: User) {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setUnlocked(false);
      return;
    }
    if (!window.confirm(`Nutzer „${user.name}" (${user.email}) wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
      return;
    }
    setSuccess(null);
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      headers: authHeaders(storedToken),
    });
    if (res.status === 401) {
      setUnlocked(false);
      setError("Token ungültig oder abgelaufen.");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    setSuccess(`Nutzer „${user.name}" gelöscht.`);
    await loadUsers(query);
  }

  if (!unlocked) {
    return (
      <form onSubmit={unlock} className="stack">
        {error && (
          <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="adminToken">Admin-Token</label>
          <input
            id="adminToken"
            type="password"
            className="input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn--primary btn--sm">
          Entsperren
        </button>
      </form>
    );
  }

  return (
    <div className="stack">
      {error && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </div>
      )}
      {success && <div className="badge badge--success">{success}</div>}

      <div className="field">
        <label htmlFor="search">Suche</label>
        <input
          id="search"
          type="search"
          className="input"
          placeholder="Name oder E-Mail …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="row row--between" style={{ flexWrap: "wrap", alignItems: "center" }}>
        <span className="muted" style={{ fontSize: 14 }}>
          {loading ? "Lädt …" : `${users.length} Nutzer`}
        </span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={lock}>
          Sperren
        </button>
      </div>

      {users.length === 0 && !loading ? (
        <p className="muted">Keine Nutzer gefunden.</p>
      ) : (
        <div className="stack">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              editing={editingId === u.id}
              onEdit={() => setEditingId(u.id)}
              onCancel={() => setEditingId(null)}
              onSave={saveEdit}
              onResetPassword={resetPassword}
              onDelete={() => removeUser(u)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  editing,
  onEdit,
  onCancel,
  onSave,
  onResetPassword,
  onDelete,
}: {
  user: User;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (id: string, data: { name?: string; email?: string; mcqEnabled?: boolean }) => Promise<void>;
  onResetPassword: (id: string, name: string, newPassword: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [mcqEnabled, setMcqEnabled] = useState(user.mcqEnabled);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setMcqEnabled(user.mcqEnabled);
  }, [user.name, user.email, user.mcqEnabled]);

  if (editing) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div className="stack">
          <div className="field">
            <label>Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>E-Mail</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <label className="row" style={{ gap: 8, alignItems: "center", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={mcqEnabled}
              onChange={(e) => setMcqEnabled(e.target.checked)}
            />
            Multiple-Choice-Fragen aktiviert
          </label>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() =>
                onSave(user.id, {
                  name: name !== user.name ? name : undefined,
                  email: email !== user.email ? email : undefined,
                  mcqEnabled: mcqEnabled !== user.mcqEnabled ? mcqEnabled : undefined,
                })
              }
            >
              Speichern
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row row--between" style={{ flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 4 }}>
          <strong>{user.name}</strong>
          <span className="muted" style={{ fontSize: 13 }}>
            {user.email}
          </span>
          <span className="muted" style={{ fontSize: 12 }}>
            Registriert: {new Date(user.createdAt).toLocaleDateString("de-DE")}
          </span>
          <span className={`badge ${user.mcqEnabled ? "badge--success" : ""}`} style={{ fontSize: 11 }}>
            MCQ {user.mcqEnabled ? "an" : "aus"}
          </span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>
            Bearbeiten
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onDelete}>
            Löschen
          </button>
        </div>
      </div>

      <div className="divider" style={{ margin: "12px 0" }} />

      <form
        className="row"
        style={{ gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (newPassword.length < 8) return;
          onResetPassword(user.id, user.name, newPassword);
          setNewPassword("");
        }}
      >
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 13 }}>Neues Passwort</label>
          <input
            className="input"
            type="password"
            placeholder="Mind. 8 Zeichen"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn--primary btn--sm" disabled={newPassword.length < 8}>
          Passwort zurücksetzen
        </button>
      </form>
    </div>
  );
}
