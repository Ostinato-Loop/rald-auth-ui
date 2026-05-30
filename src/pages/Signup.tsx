import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api, saveToken, generateRaldId, getAppId, getRedirectTo, clearRedirect } from "../lib/api";
import type { SdkState } from "../components/SdkInput";
import { useAuth } from "../App";

type FieldState = { val: string; s: SdkState };

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { login }    = useAuth();
  const [raldId]     = useState(generateRaldId);

  const [name,     setName]     = useState<FieldState>({ val: "", s: "idle" });
  const [email,    setEmail]    = useState<FieldState>({ val: "", s: "idle" });
  const [phone,    setPhone]    = useState<FieldState>({ val: "", s: "idle" });
  const [password, setPassword] = useState<FieldState>({ val: "", s: "idle" });
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const preEmail = sessionStorage.getItem("rald_new_email");
    const prePhone = sessionStorage.getItem("rald_new_phone");
    if (preEmail) setEmail({ val: preEmail, s: "verified" });
    if (prePhone) setPhone({ val: prePhone, s: "verified" });
  }, []);

  const f = (set: React.Dispatch<React.SetStateAction<FieldState>>) =>
    (val: string) => set({ val, s: val ? "typing" : "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.val.trim()) { setError("Full name is required."); return; }
    if (!email.val.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.val)) { setError("Valid email is required."); return; }
    if (!password.val || password.val.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true); setError("");
    try {
      const res = await api.register({
        name:     name.val.trim(),
        email:    email.val.trim().toLowerCase(),
        phone:    phone.val.trim() || undefined,
        password: password.val,
        raldId,
      });

      sessionStorage.removeItem("rald_otp_token");
      sessionStorage.removeItem("rald_email_token");
      sessionStorage.removeItem("rald_new_phone");
      sessionStorage.removeItem("rald_new_email");

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
          url.searchParams.set("app_id", appId);
          window.location.href = url.toString();
        } catch { window.location.href = redirectTo; }
      } else {
        try {
          const clerk = await api.clerkExchange(appId);
          window.location.href = clerk.redirectUrl;
        } catch { navigate("/dashboard"); }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create account. Try again.");
      setLoading(false);
    }
  };

  const fields: { label: string; type: string; ph: string; ac: string; fs: FieldState; set: (v: string) => void; opt?: boolean }[] = [
    { label: "Full Name",     type: "text",     ph: "Your full name",       ac: "name",        fs: name,     set: f(setName)     },
    { label: "Email Address", type: "email",    ph: "you@example.com",      ac: "email",       fs: email,    set: f(setEmail)    },
    { label: "Phone Number",  type: "tel",      ph: "08012345678",          ac: "tel",         fs: phone,    set: f(setPhone),   opt: true },
    { label: "Password",      type: "password", ph: "Min. 8 characters",    ac: "new-password", fs: password, set: f(setPassword) },
  ];

  return (
    <>
      <h1 className="page-heading">
        Join <span className="accent">RALD.</span>
      </h1>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span className="rald-id-pill">{raldId}</span>
        <p className="hint" style={{ marginTop: 5, textAlign: "center" }}>Your unique RALD identity</p>
      </div>

      <form onSubmit={handleSubmit}>
        {fields.map(({ label, type, ph, ac, fs, set, opt }) => (
          <div key={label} className="field">
            <label className="label">
              {label}
              {opt && <span style={{ opacity: .5, textTransform: "none", fontSize: 10 }}> (optional)</span>}
            </label>
            <div className="sdk-wrap" data-state={fs.s}>
              <input
                className="rald-input"
                type={type}
                autoComplete={ac}
                placeholder={ph}
                value={fs.val}
                onChange={(e) => { set(e.target.value); setError(""); }}
                disabled={loading}
              />
            </div>
          </div>
        ))}

        {error && <div className="error-bar" style={{ marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="btn-primary btn-amber"
          style={{ marginBottom: 14 }} disabled={loading}>
          {loading ? <><span className="spinner" /> Creating account…</> : "Create Account →"}
        </button>

        <p className="hint" style={{ textAlign: "center" }}>
          Already have an account?{" "}
          <a href="/" style={{ color: "var(--green)" }}
            onClick={(e) => { e.preventDefault(); navigate("/"); }}>
            Sign in
          </a>
        </p>
      </form>
    </>
  );
}
