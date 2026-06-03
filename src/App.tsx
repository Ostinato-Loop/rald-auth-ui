import { useState, useEffect, createContext, useContext } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import {
  api, saveToken, clearToken, getToken,
  saveRedirect, getRedirectTo, getAppId, clearRedirect,
  type AuthUser,
} from "./lib/api";
import IdentityPage   from "./pages/Identity";
import VerifyPage     from "./pages/Verify";
import PasswordPage   from "./pages/Password";
import SignupPage     from "./pages/Signup";
import ResetPage      from "./pages/Reset";
import DashboardPage  from "./pages/Dashboard";
import SuspendedPage  from "./pages/Suspended";

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthCtx>({
  user: null, loading: true, login: () => {}, logout: () => {},
});

export function useAuth() { return useContext(AuthContext); }

type TabId = "signin" | "signup" | "recover";

function AuthShell({ children, tab }: { children: React.ReactNode; tab: TabId }) {
  const [, navigate] = useLocation();
  const tabs: { id: TabId; label: string; icon: string; path: string }[] = [
    { id: "signin",  label: "Sign In",  icon: "→", path: "/" },
    { id: "signup",  label: "Sign Up",  icon: "✦", path: "/signup" },
    { id: "recover", label: "Recover",  icon: "⚿", path: "/reset" },
  ];
  return (
    <div className="auth-shell">
      <div className="auth-shell-inner">
        <div className="rald-card">
          <div className="card-header">
            <div className="brand-row">
              <img src="/rald-logo.png" className="brand-logo" alt="RALD" />
              <span className="brand-name">RALD</span>
            </div>
            <span className="rald-auth-badge">Identity</span>
          </div>
          <div className="card-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? "tab-active" : "tab-inactive"}`}
                onClick={() => navigate(t.path)} type="button">
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
          <div className="card-body">{children}</div>
          <div className="card-footer">
            © <span style={{ color: "var(--green)", fontWeight: 700 }}>RALD</span>
            {" · "}
            <a href="https://rald.cloud/privacy">Privacy</a>
            {" · "}
            <a href="https://rald.cloud/terms">Terms</a>
            {" · "}
            <span style={{ color: "var(--muted)" }}>profiles.rald.cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { if (!loading && !user) navigate("/"); }, [user, loading, navigate]);
  if (loading) return <Spinner />;
  return user ? <>{children}</> : null;
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
      <span className="spinner" style={{ color: "var(--green)", width: 28, height: 28, borderWidth: 3 }} />
    </div>
  );
}

export default function App() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params     = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect_to") ?? params.get("redirect");
    const appId      = params.get("app_id") ?? params.get("appId") ?? "rald-app";
    if (redirectTo) saveRedirect(redirectTo, appId);

    const token = getToken();
    if (!token) { setLoading(false); return; }

    api.me()
      .then(async (u) => {
        setUser(u);
        const storedRedirect = getRedirectTo();
        if (storedRedirect) {
          const storedAppId = getAppId();
          clearRedirect();
          try {
            const sso = await api.ssoExchange(storedAppId);
            const url = new URL(storedRedirect);
            url.searchParams.set("rald_token", sso.token);
            url.searchParams.set("app_id", storedAppId);
            window.location.href = url.toString();
          } catch {
            window.location.href = storedRedirect;
          }
        }
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login  = (token: string, u: AuthUser) => { saveToken(token); setUser(u); };
  const logout = () => { clearToken(); setUser(null); };

  if (loading) return <Spinner />;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <Router>
        <Switch>
          <Route path="/"><AuthShell tab="signin"><IdentityPage /></AuthShell></Route>
          <Route path="/login"><AuthShell tab="signin"><IdentityPage /></AuthShell></Route>
          <Route path="/verify"><AuthShell tab="signin"><VerifyPage /></AuthShell></Route>
          <Route path="/password"><AuthShell tab="signin"><PasswordPage /></AuthShell></Route>
          <Route path="/signup"><AuthShell tab="signup"><SignupPage /></AuthShell></Route>
          <Route path="/register"><AuthShell tab="signup"><SignupPage /></AuthShell></Route>
          <Route path="/reset"><AuthShell tab="recover"><ResetPage /></AuthShell></Route>
          <Route path="/forgot"><AuthShell tab="recover"><ResetPage /></AuthShell></Route>
          <Route path="/suspended"><SuspendedPage /></Route>
          <Route path="/dashboard"><RequireAuth><DashboardPage /></RequireAuth></Route>
          <Route path="/profile"><RequireAuth><DashboardPage /></RequireAuth></Route>
          <Route path="/apps"><RequireAuth><DashboardPage /></RequireAuth></Route>
          <Route>
            <AuthShell tab="signin">
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p className="hint" style={{ marginBottom: 16 }}>Page not found.</p>
                <a href="/" style={{ color: "var(--green)", fontSize: 14 }}>← Back to sign in</a>
              </div>
            </AuthShell>
          </Route>
        </Switch>
      </Router>
    </AuthContext.Provider>
  );
}
