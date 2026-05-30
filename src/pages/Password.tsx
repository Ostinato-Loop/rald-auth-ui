import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { api, saveToken, detectIdentityType, getAppId, getRedirectTo, clearRedirect } from "../lib/api";
import type { SdkState } from "../components/SdkInput";
import { useAuth } from "../App";

export default function PasswordPage() {
  const [, navigate]   = useLocation();
  const { login }      = useAuth();
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [pwState, setPwState]   = useState<SdkState>("idle");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const identity = sessionStorage.getItem("rald_identity") ?? "";
  const type     = detectIdentityType(identity);

  useEffect(() => {
    // Phone can't use password — redirect to OTP
    if (identity && type === "phone") {
      navigate("/verify");
      return;
    }
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !password) return;
    setLoading(true);
    setError("");
    setPwState("processing");

    try {
      const res = await api.login(identity, password);
      setPwState("verified");
      saveToken(res.token);
      login(res.token, res.user);
      await doRedirect(res.token);
    } catch (e: unknown) {
      setPwState("error");
      setPassword("");
      setError(e instanceof Error ? e.message : "Invalid credentials");
      setLoading(false);
    }
  };

  const doRedirect = async (_token: string) => {
    const appId      = getAppId();
    const redirectTo = getRedirectTo();
    clearRedirect();

    if (redirectTo) {
      try {
        const sso = await api.ssoExchange(appId);
        const url = new URL(redirectTo);
        url.searchParams.set("rald_token", sso.token);
        window.location.href = url.toString();
      } catch {
        window.location.href = redirectTo;
      }
      return;
    }

    try {
      const clerk = await api.clerkExchange(appId);
      window.location.href = clerk.redirectUrl;
    } catch {
      navigate("/dashboard");
    }
  };

  const masked = identity
    ? type === "email"
      ? identity.replace(/(.{2}).+(@.+)/, "$1***$2")
      : identity.slice(0, 4) + "***" + identity.slice(-4)
    : "";

  return (
    <div className="rald-card">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Welcome Back
        </h1>
        {masked && (
          <p className="hint">
            Signing in as <strong style={{ color: "var(--text)" }}>{masked}</strong>{" "}
            <button
              type="button"
              className="btn-link"
              onClick={() => navigate("/")}
              style={{ fontSize: 13 }}
            >
              Change
            </button>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label className="label">Password</label>
          <div className="sdk-wrap" data-state={pwState} style={{ position: "relative" }}>
            <input
              ref={inputRef}
              className="rald-input"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPwState(e.target.value ? "typing" : "idle");
                setError("");
              }}
              disabled={loading}
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: 12,
                padding: "4px 6px",
              }}
              tabIndex={-1}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <div className="error-bar" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ textAlign: "right", marginBottom: 20 }}>
          <button
            type="button"
            className="btn-link"
            onClick={() => navigate("/reset")}
            style={{ fontSize: 13 }}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={!password || loading}
          style={{ marginBottom: 12 }}
        >
          {loading
            ? <><span className="spinner" /> Signing in…</>
            : "Sign In"
          }
        </button>

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (identity) navigate("/verify");
              else navigate("/");
            }}
          >
            Use OTP Instead
          </button>
        </div>
      </form>
    </div>
  );
}
