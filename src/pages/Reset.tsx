import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import type { SdkState } from "../components/SdkInput";

type Step = "request" | "verify" | "done";

export default function ResetPage() {
  const [, navigate] = useLocation();
  const [step, setStep]   = useState<Step>("request");
  const [email, setEmail] = useState(sessionStorage.getItem("rald_identity") ?? "");
  const [code,  setCode]  = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [eState, setEState] = useState<SdkState>(email ? "verified" : "idle");
  const [cState, setCState] = useState<SdkState>("idle");
  const [pState, setPState] = useState<SdkState>("idle");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError(""); setEState("processing");
    try {
      await api.requestReset(email);
      setEState("verified");
      setTimeout(() => setStep("verify"), 300);
    } catch (e: unknown) {
      setEState("error");
      setError(e instanceof Error ? e.message : "Request failed. Check the email address.");
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPw) return;
    if (newPw !== confPw)    { setError("Passwords do not match."); setPState("error"); return; }
    if (newPw.length < 8)    { setError("Password must be at least 8 characters."); setPState("error"); return; }
    setLoading(true); setError(""); setCState("processing"); setPState("processing");
    try {
      await api.resetPassword(email, code, newPw);
      setCState("verified"); setPState("verified");
      setStep("done");
    } catch (e: unknown) {
      setCState("error"); setPState("error");
      setError(e instanceof Error ? e.message : "Reset failed. Check your code.");
    } finally { setLoading(false); }
  };

  if (step === "done") return (
    <>
      <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--green-dim)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>✓</div>
        <h1 className="page-heading">Password <span className="accent">updated.</span></h1>
        <p className="page-sub" style={{ marginTop: 6 }}>You can now sign in with your new password.</p>
      </div>
      <button className="btn-primary btn-amber" onClick={() => navigate("/password")}>
        Sign In →
      </button>
    </>
  );

  if (step === "verify") return (
    <>
      <h1 className="page-heading">Recover your <span className="accent">account.</span></h1>
      <p className="page-sub">Code sent to <strong style={{ color: "var(--text)" }}>{email}</strong></p>

      <form onSubmit={handleReset}>
        <div className="field">
          <label className="label">Reset Code</label>
          <div className="sdk-wrap" data-state={cState}>
            <input className="rald-input" type="text" inputMode="numeric" maxLength={6}
              placeholder="6-digit code" value={code} autoFocus
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCState(e.target.value ? "typing" : "idle"); setError(""); }}
              disabled={loading} />
          </div>
        </div>
        <div className="field">
          <label className="label">New Password</label>
          <div className="sdk-wrap" data-state={pState}>
            <input className="rald-input" type="password" autoComplete="new-password"
              placeholder="Min. 8 characters" value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setPState(e.target.value ? "typing" : "idle"); setError(""); }}
              disabled={loading} />
          </div>
        </div>
        <div className="field">
          <label className="label">Confirm Password</label>
          <div className="sdk-wrap" data-state={confPw && confPw !== newPw ? "error" : confPw ? "typing" : "idle"}>
            <input className="rald-input" type="password" autoComplete="new-password"
              placeholder="Repeat new password" value={confPw}
              onChange={(e) => { setConfPw(e.target.value); setError(""); }}
              disabled={loading} />
          </div>
        </div>

        {error && <div className="error-bar" style={{ marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="btn-primary btn-amber"
          style={{ marginBottom: 10 }} disabled={loading || !code || !newPw || !confPw}>
          {loading ? <><span className="spinner" /> Resetting…</> : "Set New Password →"}
        </button>
        <div style={{ textAlign: "center" }}>
          <button type="button" className="btn-ghost" onClick={() => { setStep("request"); setCode(""); setNewPw(""); setConfPw(""); setError(""); }}>
            ← Send a new code
          </button>
        </div>
      </form>
    </>
  );

  return (
    <>
      <h1 className="page-heading">Recover your <span className="accent">account.</span></h1>
      <p className="page-sub">Enter your email — we'll send a reset code.</p>

      <form onSubmit={handleRequest}>
        <div className="field">
          <label className="label">Email Address</label>
          <div className="sdk-wrap" data-state={eState}>
            <input className="rald-input" type="email" inputMode="email" autoComplete="email"
              placeholder="you@example.com" value={email} autoFocus
              onChange={(e) => { setEmail(e.target.value); setEState(e.target.value ? "typing" : "idle"); setError(""); }}
              disabled={loading} />
          </div>
        </div>

        {error && <div className="error-bar" style={{ marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="btn-primary btn-amber"
          style={{ marginBottom: 10 }} disabled={!email.trim() || loading}>
          {loading ? <><span className="spinner" /> Sending…</> : "Send Reset Code →"}
        </button>
        <div style={{ textAlign: "center" }}>
          <button type="button" className="btn-ghost" onClick={() => navigate("/password")}>
            Back to Sign In
          </button>
        </div>
      </form>
    </>
  );
}
