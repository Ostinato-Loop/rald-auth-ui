import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import type { SdkState } from "../components/SdkInput";

type Step = "request" | "verify" | "done";

export default function ResetPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("request");

  const [email,    setEmail]    = useState(sessionStorage.getItem("rald_identity") ?? "");
  const [code,     setCode]     = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [emailState, setEmailState] = useState<SdkState>("idle");
  const [codeState,  setCodeState]  = useState<SdkState>("idle");
  const [pwState,    setPwState]    = useState<SdkState>("idle");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setEmailState("processing");

    try {
      await api.requestReset(email);
      setEmailState("verified");
      setTimeout(() => setStep("verify"), 300);
    } catch (e: unknown) {
      setEmailState("error");
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPw) return;
    if (newPw !== confirmPw) { setError("Passwords do not match."); setPwState("error"); return; }
    if (newPw.length < 8)    { setError("Password must be at least 8 characters."); setPwState("error"); return; }

    setLoading(true);
    setError("");
    setCodeState("processing");
    setPwState("processing");

    try {
      await api.resetPassword(email, code, newPw);
      setCodeState("verified");
      setPwState("verified");
      setStep("done");
    } catch (e: unknown) {
      setCodeState("error");
      setPwState("error");
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="rald-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Password Updated</h2>
        <p className="hint" style={{ marginBottom: 28 }}>You can now sign in with your new password.</p>
        <button className="btn-primary" onClick={() => navigate("/password")}>
          Sign In
        </button>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="rald-card">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            Reset Password
          </h1>
          <p className="hint">Enter the code sent to <strong style={{ color: "var(--text)" }}>{email}</strong></p>
        </div>

        <form onSubmit={handleReset}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Reset Code</label>
            <div className="sdk-wrap" data-state={codeState}>
              <input
                className="rald-input"
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeState(e.target.value ? "typing" : "idle"); setError(""); }}
                disabled={loading}
                maxLength={6}
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">New Password</label>
            <div className="sdk-wrap" data-state={pwState}>
              <input
                className="rald-input"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwState(e.target.value ? "typing" : "idle"); setError(""); }}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Confirm Password</label>
            <div className="sdk-wrap" data-state={pwState === "error" ? "error" : (confirmPw ? "typing" : "idle")}>
              <input
                className="rald-input"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="error-bar" style={{ marginBottom: 16 }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading || !code || !newPw || !confirmPw}>
            {loading ? <><span className="spinner" /> Resetting…</> : "Set New Password"}
          </button>

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button type="button" className="btn-ghost" onClick={() => setStep("request")} style={{ fontSize: 13 }}>
              ← Send new code
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rald-card">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Reset Password
        </h1>
        <p className="hint">Enter your email and we'll send you a reset code.</p>
      </div>

      <form onSubmit={handleRequest}>
        <div style={{ marginBottom: 20 }}>
          <label className="label">Email Address</label>
          <div className="sdk-wrap" data-state={emailState}>
            <input
              className="rald-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailState(e.target.value ? "typing" : "idle"); setError(""); }}
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        {error && <div className="error-bar" style={{ marginBottom: 16 }}>{error}</div>}

        <button type="submit" className="btn-primary" disabled={!email.trim() || loading} style={{ marginBottom: 12 }}>
          {loading ? <><span className="spinner" /> Sending…</> : "Send Reset Code"}
        </button>

        <div style={{ textAlign: "center" }}>
          <button type="button" className="btn-ghost" onClick={() => navigate("/password")}>
            Back to Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
