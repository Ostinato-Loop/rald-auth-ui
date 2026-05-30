import { useState } from "react";
import { api } from "../lib/api";

type Step = "email" | "reset" | "done";

export default function ForgotPage() {
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email.trim()) return setErr("Email is required.");
    setLoading(true);
    try {
      await api.requestReset(email.trim());
      setStep("reset");
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!code.trim()) return setErr("Enter the reset code.");
    if (pass.length < 8) return setErr("Password must be at least 8 characters.");
    if (pass !== confirm) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      await api.resetPassword(email, code, pass);
      setStep("done");
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      {step === "email" && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Reset password</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            We'll send a 6-digit code to your email.
          </p>
          <form onSubmit={requestReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            {err && <div className="error-msg">{err}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Send reset code"}
            </button>
          </form>
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <a href="/login" style={{ fontSize: 14, color: "var(--text-muted)" }}>← Back to sign in</a>
          </div>
        </>
      )}

      {step === "reset" && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>New password</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            Check your email for the 6-digit reset code.
          </p>
          <form onSubmit={doReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">Reset code</label>
              <input
                className="input-field"
                type="text"
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Min. 8 characters"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
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
              {loading ? <span className="spinner" /> : "Reset password"}
            </button>
          </form>
        </>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Password updated</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
            Your password has been changed. You can now sign in.
          </p>
          <a href="/login" className="btn-primary" style={{ display: "inline-block", textDecoration: "none", padding: "13px 32px" }}>
            Sign in
          </a>
        </div>
      )}
    </div>
  );
}
