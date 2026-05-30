import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { detectIdentityType, saveRedirect } from "../lib/api";
import type { SdkState } from "../components/SdkInput";

export default function IdentityPage() {
  const [, navigate] = useLocation();
  const [value, setValue]     = useState("");
  const [sdkState, setSdkState] = useState<SdkState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Capture redirect_to and app_id from URL params
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect_to") ?? params.get("redirect");
    const appId      = params.get("app_id") ?? params.get("appId") ?? "rald-app";
    if (redirectTo) saveRedirect(redirectTo, appId);

    inputRef.current?.focus();
  }, []);

  const type = detectIdentityType(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setSdkState(e.target.value ? "typing" : "idle");
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setSdkState("processing");
    // Store identity for next page
    sessionStorage.setItem("rald_identity", value.trim());
    sessionStorage.setItem("rald_identity_type", type);
    navigate("/verify");
  };

  const handlePassword = () => {
    if (!value.trim()) {
      sessionStorage.removeItem("rald_identity");
      navigate("/password");
      return;
    }
    sessionStorage.setItem("rald_identity", value.trim());
    sessionStorage.setItem("rald_identity_type", type);
    navigate("/password");
  };

  const displayHint = value.trim()
    ? type === "email"
      ? "We'll send a verification code to this email"
      : "We'll send a verification code via SMS"
    : "";

  return (
    <div className="rald-card">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8, letterSpacing: ".01em" }}>
          One Identity. Entire Ecosystem.
        </p>
      </div>

      <form onSubmit={handleContinue}>
        <div style={{ marginBottom: 20 }}>
          <label className="label">Email or Phone Number</label>
          <div className="sdk-wrap" data-state={sdkState}>
            <input
              ref={inputRef}
              className="rald-input"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="john@example.com or 08012345678"
              value={value}
              onChange={handleChange}
              disabled={sdkState === "processing"}
              aria-label="Email or phone number"
            />
          </div>
          {displayHint && (
            <p className="hint" style={{ marginTop: 6 }}>{displayHint}</p>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={!value.trim() || sdkState === "processing"}
          style={{ marginBottom: 12 }}
        >
          {sdkState === "processing"
            ? <><span className="spinner" /> Sending code…</>
            : "Continue →"
          }
        </button>

        <div style={{ textAlign: "center" }}>
          <button type="button" className="btn-ghost" onClick={handlePassword}>
            Use Password Instead
          </button>
        </div>
      </form>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          No account?{" "}
          <a href="/signup" onClick={(e) => { e.preventDefault(); navigate("/signup"); }}>
            Create one
          </a>
        </span>
      </div>
    </div>
  );
}
