import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { useAuth } from "../App";

type Tab = "password" | "phone" | "email";
type Step = "input" | "otp";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [tab, setTab] = useState<Tab>("password");
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Password tab
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone tab
  const [phone, setPhone] = useState("");
  const [pinId, setPinId] = useState("");

  // Email OTP tab
  const [emailOtp, setEmailOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");

  // OTP digits
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      setOtp(digits.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const clear = () => { setErr(""); };

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault(); clear();
    if (!email || !password) return setErr("Email and password are required.");
    setLoading(true);
    try {
      const res = await api.login(email, password);
      login(res.token, res.user);
      navigate("/");
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault(); clear();
    setLoading(true);
    try {
      const res = await api.sendOtp(phone);
      setPinId(res.pinId ?? "");
      setStep("otp");
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function submitEmailOtp(e: React.FormEvent) {
    e.preventDefault(); clear();
    setLoading(true);
    try {
      const res = await api.sendOtp(emailOtp);
      setSessionToken(res.sessionToken ?? "");
      setStep("otp");
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault(); clear();
    const code = otp.join("");
    if (code.length < 6) return setErr("Enter all 6 digits.");
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone, code, { pinId });
      if ("token" in res) {
        login(res.token, res.user);
        navigate("/");
      } else {
        const ph = ("phone" in res ? res.phone : undefined) ?? "";
        const tk = ("otpToken" in res ? res.otpToken : undefined) ?? "";
        navigate("/register?mode=otp&phone=" + encodeURIComponent(ph) + "&token=" + encodeURIComponent(tk));
      }
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault(); clear();
    const code = otp.join("");
    if (code.length < 6) return setErr("Enter all 6 digits.");
    setLoading(true);
    try {
      const res = await api.verifyOtp(emailOtp, code, { sessionToken });
      if ("token" in res) {
        login(res.token, res.user);
        navigate("/");
      } else {
        const em = ("email" in res ? res.email : undefined) ?? "";
        const tk = ("emailToken" in res ? res.emailToken : undefined) ?? "";
        navigate("/register?mode=email&email=" + encodeURIComponent(em) + "&token=" + encodeURIComponent(tk));
      }
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  const otpStep = (
    <form onSubmit={tab === "phone" ? verifyPhoneOtp : verifyEmailOtp} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>
          Enter the 6-digit code sent to <strong style={{ color: "var(--text-primary)" }}>
            {tab === "phone" ? phone : emailOtp}
          </strong>
        </p>
      </div>
      <div className="otp-grid" onPaste={handleOtpPaste}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            className="otp-input"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKey(i, e)}
            autoFocus={i === 0}
          />
        ))}
      </div>
      {err && <div className="error-msg">{err}</div>}
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : "Verify code"}
      </button>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => { setStep("input"); setOtp(["","","","","",""]); setErr(""); }}
      >
        ← Back
      </button>
    </form>
  );

  return (
    <div className="card">
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Sign in</h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
        Welcome back to RALD
      </p>

      {step === "input" && (
        <>
          <div className="tab-bar" style={{ marginBottom: 24 }}>
            {(["password", "phone", "email"] as Tab[]).map((t) => (
              <button
                key={t}
                className={`tab-btn${tab === t ? " active" : ""}`}
                onClick={() => { setTab(t); setErr(""); }}
              >
                {t === "password" ? "Password" : t === "phone" ? "Phone" : "Email OTP"}
              </button>
            ))}
          </div>

          {tab === "password" && (
            <form onSubmit={submitPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <div style={{ marginTop: 6, textAlign: "right" }}>
                  <a href="/forgot" style={{ fontSize: 13, color: "var(--text-muted)" }}>Forgot password?</a>
                </div>
              </div>
              {err && <div className="error-msg">{err}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : "Sign in"}
              </button>
            </form>
          )}

          {tab === "phone" && (
            <form onSubmit={submitPhone} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">Phone number</label>
                <input
                  className="input-field"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              {err && <div className="error-msg">{err}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : "Send code"}
              </button>
            </form>
          )}

          {tab === "email" && (
            <form onSubmit={submitEmailOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {err && <div className="error-msg">{err}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : "Send code"}
              </button>
            </form>
          )}

          <div style={{ marginTop: 24 }} className="divider">or</div>
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
            No account?{" "}
            <a href="/register" style={{ color: "var(--green)", fontWeight: 600 }}>Create one</a>
          </div>
        </>
      )}

      {step === "otp" && otpStep}
    </div>
  );
}
