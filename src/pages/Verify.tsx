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
  const [, navigate]      = useLocation();
  const { login }         = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [boxState, setBoxState] = useState<OtpBoxState>("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [sessionData, setSessionData] = useState<{ pinId?: string; sessionToken?: string }>({});

  const identity = sessionStorage.getItem("rald_identity") ?? "";
  const type     = detectIdentityType(identity);

  // Mask display: john***@gmail.com or +234***5678
  const masked = type === "email"
    ? identity.replace(/(.{2}).+(@.+)/, "$1***$2")
    : identity.slice(0, 4) + "***" + identity.slice(-4);

  // Send OTP on mount
  useEffect(() => {
    if (!identity) { navigate("/"); return; }
    sendCode();
  }, []); // eslint-disable-line

  const sendCode = useCallback(async () => {
    setError("");
    setCountdown(59);
    try {
      const res = await api.sendOtp(identity);
      setSessionData({
        pinId: res.pinId,
        sessionToken: res.sessionToken,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    }
  }, [identity]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every(Boolean) && !loading) {
      submit(digits.join(""));
    }
  }, [digits]); // eslint-disable-line

  const submit = async (code: string) => {
    if (loading) return;
    setLoading(true);
    setBoxState("processing" as OtpBoxState);
    setError("");

    try {
      const res = await api.verifyOtp(identity, code, sessionData);

      if (isAuthResponse(res)) {
        setBoxState("verified");
        saveToken(res.token);
        login(res.token, res.user);
        await doRedirect(res.token);
        return;
      }

      // New user — store OTP data and go to signup
      if (res.newUser) {
        setBoxState("verified");
        sessionStorage.setItem("rald_otp_token",   res.otpToken ?? "");
        sessionStorage.setItem("rald_email_token", res.emailToken ?? "");
        sessionStorage.setItem("rald_new_phone",   res.phone ?? "");
        sessionStorage.setItem("rald_new_email",   res.email ?? "");
        setTimeout(() => navigate("/signup"), 400);
      }
    } catch (e: unknown) {
      setBoxState("error");
      setDigits(Array(6).fill(""));
      setError(e instanceof Error ? e.message : "Invalid code. Try again.");
      setLoading(false);
    }
  };

  const doRedirect = async (token: string) => {
    const appId      = getAppId();
    const redirectTo = getRedirectTo();
    clearRedirect();

    if (redirectTo) {
      try {
        // Exchange for app-scoped token
        const sso = await api.ssoExchange(appId);
        const url = new URL(redirectTo);
        url.searchParams.set("rald_token", sso.token);
        url.searchParams.set("app_id", appId);
        window.location.href = url.toString();
      } catch {
        window.location.href = redirectTo;
      }
      return;
    }

    // Try Clerk exchange for apps that support it
    try {
      const clerk = await api.clerkExchange(appId);
      window.location.href = clerk.redirectUrl;
    } catch {
      navigate("/dashboard");
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setDigits(Array(6).fill(""));
    setBoxState("idle");
    setError("");
    sendCode();
  };

  const handlePasswordInstead = () => navigate("/password");

  return (
    <div className="rald-card">
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          Verify Identity
        </h1>
        <p className="hint">
          Enter the 6-digit code sent to<br />
          <strong style={{ color: "var(--text)" }}>{masked}</strong>
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <OtpBoxes
          value={digits}
          onChange={setDigits}
          state={boxState}
          disabled={loading}
          autoFocus
        />
      </div>

      {error && <div className="error-bar" style={{ marginBottom: 16 }}>{error}</div>}

      {loading && boxState === "processing" && !error && (
        <div style={{ textAlign: "center", color: "var(--amber)", fontSize: 13, marginBottom: 16 }}>
          <span className="spinner" style={{ marginRight: 8 }} />
          Verifying…
        </div>
      )}

      {/* Row: Use Password Instead  |  00:NN  Resend */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
      }}>
        <button
          type="button"
          className="btn-ghost"
          onClick={handlePasswordInstead}
          style={{ fontSize: 13, opacity: .65 }}
        >
          Use Password Instead
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 13,
            fontVariantNumeric: "tabular-nums",
            color: countdown > 0 ? "var(--muted)" : "var(--green)",
            minWidth: 36,
          }}>
            {countdown > 0
              ? `0:${String(countdown).padStart(2, "0")}`
              : "0:00"}
          </span>
          <button
            type="button"
            className="btn-link"
            onClick={handleResend}
            disabled={countdown > 0}
            style={{ opacity: countdown > 0 ? .35 : 1 }}
          >
            Resend
          </button>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => navigate("/")}
          style={{ fontSize: 12 }}
        >
          ← Change email or phone
        </button>
      </div>
    </div>
  );
}
