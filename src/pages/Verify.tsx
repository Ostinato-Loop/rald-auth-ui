import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { api, saveToken, getAppId, getRedirectTo, clearRedirect, detectIdentityType } from "../lib/api";
import type { AuthResponse, OtpVerifyResponse } from "../lib/api";
import OtpBoxes from "../components/OtpBoxes";
import type { OtpBoxState } from "../components/OtpBoxes";
import { useAuth } from "../App";

function isAuthResponse(r: OtpVerifyResponse): r is AuthResponse {
  return "token" in r && "user" in r;
}

export default function VerifyPage() {
  const [, navigate]    = useLocation();
  const { login }       = useAuth();
  const [digits, setDigits]       = useState<string[]>(Array(6).fill(""));
  const [boxState, setBoxState]   = useState<OtpBoxState>("idle");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [sessionData, setSessionData] = useState<{ pinId?: string; sessionToken?: string }>({});

  const identity = sessionStorage.getItem("rald_identity") ?? "";
  const type     = detectIdentityType(identity);

  const masked = type === "email"
    ? identity.replace(/(.{2}).+(@.+)/, "$1***$2")
    : identity.slice(0, 4) + "***" + identity.slice(-4);

  useEffect(() => {
    if (!identity) { navigate("/"); return; }
    sendCode();
  }, []); // eslint-disable-line

  const sendCode = useCallback(async () => {
    setError(""); setCountdown(59);
    try {
      const res = await api.sendOtp(identity);
      setSessionData({ pinId: res.pinId, sessionToken: res.sessionToken });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send code. Please try again.");
    }
  }, [identity]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (digits.every(Boolean) && !loading) submit(digits.join(""));
  }, [digits]); // eslint-disable-line

  const submit = async (code: string) => {
    if (loading) return;
    setLoading(true); setBoxState("filled"); setError("");
    try {
      const res = await api.verifyOtp(identity, code, sessionData);
      if (isAuthResponse(res)) {
        setBoxState("verified");
        saveToken(res.token);
        login(res.token, res.user);
        await doRedirect();
        return;
      }
      if (res.newUser) {
        setBoxState("verified");
        sessionStorage.setItem("rald_otp_token",   ("otpToken"   in res ? res.otpToken   : undefined) ?? "");
        sessionStorage.setItem("rald_email_token", ("emailToken" in res ? res.emailToken : undefined) ?? "");
        sessionStorage.setItem("rald_new_phone",   ("phone"      in res ? res.phone      : undefined) ?? "");
        sessionStorage.setItem("rald_new_email",   ("email"      in res ? res.email      : undefined) ?? "");
        setTimeout(() => navigate("/signup"), 400);
      }
    } catch (e: unknown) {
      setBoxState("error");
      setDigits(Array(6).fill(""));
      setError(e instanceof Error ? e.message : "Invalid code. Try again.");
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
        const url = new URL(redirectTo);
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

  return (
    <>
      <h1 className="page-heading">
        Verify your <span className="accent">identity.</span>
      </h1>
      <p className="page-sub">
        Enter the 6-digit code sent to{" "}
        <strong style={{ color: "var(--text)" }}>{masked}</strong>
      </p>

      <div style={{ marginBottom: 20 }}>
        <OtpBoxes
          value={digits}
          onChange={setDigits}
          state={boxState}
          disabled={loading}
          autoFocus
        />
      </div>

      {error && (
        <div className="error-bar" style={{ marginBottom: 14 }}>{error}</div>
      )}

      {loading && !error && (
        <div style={{ textAlign: "center", color: "var(--amber)", fontSize: 13, marginBottom: 14 }}>
          <span className="spinner" style={{ marginRight: 6 }} />Verifying…
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button type="button" className="btn-ghost" style={{ fontSize: 13 }}
          onClick={() => navigate("/password")}>
          Use Password Instead
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: countdown > 0 ? "var(--muted)" : "var(--green)", minWidth: 32 }}>
            {countdown > 0 ? `0:${String(countdown).padStart(2, "0")}` : "0:00"}
          </span>
          <button type="button" className="btn-link"
            onClick={() => { if (countdown > 0) return; setDigits(Array(6).fill("")); setBoxState("idle"); sendCode(); }}
            disabled={countdown > 0}
            style={{ opacity: countdown > 0 ? .3 : 1 }}>
            Resend
          </button>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button type="button" className="btn-ghost" style={{ fontSize: 12 }}
          onClick={() => navigate("/")}>
          ← Change email or phone
        </button>
      </div>
    </>
  );
}
