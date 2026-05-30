import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api, saveToken, generateRaldId, getAppId, getRedirectTo, clearRedirect } from "../lib/api";
import type { SdkState } from "../components/SdkInput";
import { useAuth } from "../App";

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { login }    = useAuth();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [raldId]                = useState(generateRaldId);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const [nameState,  setNameState]  = useState<SdkState>("idle");
  const [emailState, setEmailState] = useState<SdkState>("idle");
  const [phoneState, setPhoneState] = useState<SdkState>("idle");
  const [pwState,    setPwState]    = useState<SdkState>("idle");

  // Pre-fill from OTP flow if coming from verify
  useEffect(() => {
    const preEmail = sessionStorage.getItem("rald_new_email");
    const prePhone = sessionStorage.getItem("rald_new_phone");
    if (preEmail) setEmail(preEmail);
    if (prePhone) setPhone(prePhone);
  }, []);

  const validate = () => {
    if (!name.trim())  { setNameState("error");  return "Full name is required."; }
    if (!email.trim()) { setEmailState("error"); return "Email address is required."; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailState("error"); return "Please enter a valid email."; }
    if (!password)     { setPwState("error");    return "Password must be at least 8 characters."; }
    if (password.length < 8) { setPwState("error"); return "Password must be at least 8 characters."; }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");

    // Check if we have OTP tokens from verify flow
    const otpToken   = sessionStorage.getItem("rald_otp_token");
    const emailToken = sessionStorage.getItem("rald_email_token");

    try {
      let res;
      if (otpToken || emailToken) {
        res = await api.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          raldId,
        });
      } else {
        res = await api.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          raldId,
        });
      }

      // Clean up OTP state
      sessionStorage.removeItem("rald_otp_token");
      sessionStorage.removeItem("rald_email_token");
      sessionStorage.removeItem("rald_new_phone");
      sessionStorage.removeItem("rald_new_email");

      setNameState("verified");
      setEmailState("verified");
      setPwState("verified");

      saveToken(res.token);
      login(res.token, res.user);

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
      } else {
        try {
          const clerk = await api.clerkExchange(appId);
          window.location.href = clerk.redirectUrl;
        } catch {
          navigate("/dashboard");
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create account. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="rald-card">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Create Your RALD Account
        </h1>
        <p className="hint">One identity across the entire RALD ecosystem.</p>
      </div>

      {/* RALD ID */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <span className="rald-id">{raldId}</span>
        <p className="hint" style={{ marginTop: 6, fontSize: 11 }}>Your unique RALD identity</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Full Name</label>
          <div className="sdk-wrap" data-state={nameState}>
            <input
              className="rald-input"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameState(e.target.value ? "typing" : "idle"); setError(""); }}
              disabled={loading}
            />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
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
            />
          </div>
        </div>

        {/* Phone (optional) */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Phone Number <span style={{ opacity: .5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <div className="sdk-wrap" data-state={phoneState}>
            <input
              className="rald-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08012345678 or +2348012345678"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneState(e.target.value ? "typing" : "idle"); }}
              disabled={loading}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <label className="label">Password</label>
          <div className="sdk-wrap" data-state={pwState}>
            <input
              className="rald-input"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwState(e.target.value ? "typing" : "idle"); setError(""); }}
              disabled={loading}
            />
          </div>
        </div>

        {error && <div className="error-bar" style={{ marginBottom: 16 }}>{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginBottom: 16 }}>
          {loading
            ? <><span className="spinner" /> Creating account…</>
            : "Create Account"
          }
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          Already have an account?{" "}
          <button type="button" className="btn-link" onClick={() => navigate("/")}>Sign in</button>
        </p>
      </form>
    </div>
  );
}
