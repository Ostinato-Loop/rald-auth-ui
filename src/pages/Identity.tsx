import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { detectIdentityType, saveRedirect } from "../lib/api";
import type { SdkState } from "../components/SdkInput";

export default function IdentityPage() {
  const [, navigate]    = useLocation();
  const [value, setValue]     = useState("");
  const [sdkState, setSdkState] = useState<SdkState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect_to") ?? params.get("redirect");
    const appId      = params.get("app_id") ?? params.get("appId") ?? "rald-app";
    if (redirectTo) saveRedirect(redirectTo, appId);
    inputRef.current?.focus();
  }, []);

  const type = detectIdentityType(value);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setSdkState("processing");
    sessionStorage.setItem("rald_identity", value.trim());
    sessionStorage.setItem("rald_identity_type", type);
    navigate("/verify");
  };

  const hint = value.trim()
    ? type === "email"
      ? "We'll send a verification code to this email address"
      : "We'll send a 6-digit code via SMS"
    : "";

  return (
    <>
      <h1 className="page-heading">
        Welcome <span className="accent">back.</span>
      </h1>
      <p className="page-sub">
        Enter your email or phone — we'll send a 6-digit code.
      </p>

      <form onSubmit={handleContinue}>
        <div className="field">
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
              onChange={(e) => {
                setValue(e.target.value);
                setSdkState(e.target.value ? "typing" : "idle");
              }}
              disabled={sdkState === "processing"}
            />
          </div>
          {hint && <p className="hint" style={{ marginTop: 6 }}>{hint}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary btn-amber"
          style={{ marginBottom: 10 }}
          disabled={!value.trim() || sdkState === "processing"}
        >
          {sdkState === "processing"
            ? <><span className="spinner" /> Sending code…</>
            : <>Send code →</>
          }
        </button>

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (value.trim()) {
                sessionStorage.setItem("rald_identity", value.trim());
                sessionStorage.setItem("rald_identity_type", type);
              }
              navigate("/password");
            }}
          >
            Use Password Instead
          </button>
        </div>
      </form>

      <p className="hint" style={{ textAlign: "center", marginTop: 18 }}>
        No account?{" "}
        <a
          href="/signup"
          style={{ color: "var(--green)" }}
          onClick={(e) => { e.preventDefault(); navigate("/signup"); }}
        >
          Create one
        </a>
      </p>
    </>
  );
}
