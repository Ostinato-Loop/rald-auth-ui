import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { useAuth } from "../App";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"user" | "merchant">("user");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Full name is required.");
    if (!email.trim()) return setErr("Email is required.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      const res = await api.register({ name: name.trim(), email: email.trim(), password, role });
      login(res.token, res.user);
      navigate("/");
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Create account</h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
        Join the RALD ecosystem
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["user", "merchant"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              border: `1px solid ${role === r ? "var(--green)" : "var(--border)"}`,
              background: role === r ? "var(--green-dim)" : "transparent",
              color: role === r ? "var(--green)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {r === "user" ? "Personal" : "Business"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="label">{role === "merchant" ? "Business / owner name" : "Full name"}</label>
          <input
            className="input-field"
            type="text"
            placeholder="Emeka Okonkwo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input-field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input-field"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            className="input-field"
            type="password"
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {err && <div className="error-msg">{err}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : "Create account"}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
        Have an account?{" "}
        <a href="/login" style={{ color: "var(--green)", fontWeight: 600 }}>Sign in</a>
      </div>
    </div>
  );
}
