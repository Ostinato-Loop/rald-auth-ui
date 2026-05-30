import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { api, saveToken, detectIdentityType, getAppId, getRedirectTo, clearRedirect } from "../lib/api";
import type { SdkState } from "../components/SdkInput";
import { useAuth } from "../App";

export default function PasswordPage() {
  const [, navigate]  = useLocation();
  const { login }     = useAuth();
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [sdkState, setSdkState] = useState<SdkState>("idle");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const identity = sessionStorage.getItem("rald_identity") ?? "";
  const type     = identity ? detectIdentityType(identity) : "email";

  useEffect(() => {
    if (identity && type === "phone") { navigate("/verify"); return; }
    inputRef.current?.focus();
  }, []); // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !password) return;
    setLoading(true); setError(""); setSdkState("processing");
    try {
      const res = await api.login(identity, password);
      setSdkState("verified");
      saveToken(res.token);
      login(res.token, res.user);
      await doRedirect();
    } catch (e: unknown) {
      setSdkState("error"); setPassword("");
      setError(e instanceof Error ? e.message : "Invalid credentials. Try again.");
      setLoading(false);
    }
  };

  const doRedirect = async () => {
    const appId      = getAppId();
    const redirectTo = getRedirectTo();
    clearRedirect();
    if (redirectTo) {
      try {
        const sso = await api.ssoExchange(appId);
        const url  = new URL(redirectTo);
        url.searchParams.set("rald_token", sso.token);
        url.searchParams.set("app_id", appId);
        window.location.href = url.toString();
      } catch { window.location.href = redirectTo; }
      return;
    }
    try {
      const clerk = await api.clerkExchange(appId);
      window.location.href = clerk.redirectUrl;
    } catch { navigate("/dashboard"); }
  };

  const maskedId = identity
    ? type === "email"
      ? identity.replace(/(.{2}).+(@.+)/, "$1***$2")
      : identity.slice(0, 4) + "***" + identity.slice(-4)
    : "";

  return (
    <>
      <h1 className="page-heading">
        Welcome <span className="accent">back.</span>
      </h1>
      {maskedId && (
        <p className="page-sub">
          Signing in as{" "}
          <strong style={{ color: "var(--text)" }}>{maskedId}</strong>
          {" · "}
          <button type="button" className="btn-link" style={{ fontSize: 13 }} onClick={() => navigate("/")}>
            Change
          </button>
        </p>
      )}
      {!maskedId && <p className="page-sub">Enter your password to sign in.</p>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Password</label>
          <div className="sdk-wrap" data-state={sdkState} style={{ position: "relative" }}>
            <input
              ref={inputRef}
              className="rald-input rald-input-icon"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSdkState(e.target.value ? "typing" : "idle");
                setError("");
              }}
              disabled={loading}
            />
            <button type="button" onClick={() => setShow((s) => !s)} style={{
              position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12,
            }}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <div className="error-bar" style={{ marginBottom: 12 }}>{error}</div>}

        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <button type="button" className="btn-link" style={{ fontSize: 13 }} onClick={() => navigate("/reset")}>
            Forgot password?
          </button>
        </div>

        <button type="submit" className="btn-primary btn-amber"
          style={{ marginBottom: 10 }} disabled={!password || loading}>
          {loading ? <><span className="spinner" /> Signing in…</> : "Sign In →"}
        </button>

        <div style={{ textAlign: "center" }}>
          <button type="button" className="btn-ghost"
            onClick={() => identity ? navigate("/verify") : navigate("/")}>
            Use OTP Instead
          </button>
        </div>
      </form>
    </>
  );
}
