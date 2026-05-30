import { useState, useEffect, createContext, useContext } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { api, saveToken, clearToken, getToken, type AuthUser } from "./lib/api";
import Logo from "./components/Logo";
import IdentityPage  from "./pages/Identity";
import VerifyPage    from "./pages/Verify";
import PasswordPage  from "./pages/Password";
import SignupPage    from "./pages/Signup";
import ResetPage     from "./pages/Reset";
import DashboardPage from "./pages/Dashboard";

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-inner">
        {/* Logo + title */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Logo size={52} />
          <h2 style={{
            marginTop: 14,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: ".12em",
            color: "#F5F7FA",
          }}>
            RALD AUTH
          </h2>
        </div>

        {children}

        <p style={{
          textAlign: "center",
          fontSize: 11,
          color: "#606870",
          marginTop: 28,
          lineHeight: 1.7,
        }}>
          Secured by RALD ·{" "}
          <a href="https://rald.cloud/privacy" style={{ color: "#606870" }}>Privacy</a>
          {" · "}
          <a href="https://rald.cloud/terms" style={{ color: "#606870" }}>Terms</a>
        </p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg)",
      }}>
        <span className="spinner" style={{ color: "var(--green)", width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}

export default function App() {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.me()
      .then((u) => setUser(u))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, u: AuthUser) => {
    saveToken(token);
    setUser(u);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <Router>
        <Switch>
          {/* Auth entry — identity field */}
          <Route path="/">
            <AuthShell><IdentityPage /></AuthShell>
          </Route>
          <Route path="/login">
            <AuthShell><IdentityPage /></AuthShell>
          </Route>

          {/* OTP verify */}
          <Route path="/verify">
            <AuthShell><VerifyPage /></AuthShell>
          </Route>

          {/* Password sign-in */}
          <Route path="/password">
            <AuthShell><PasswordPage /></AuthShell>
          </Route>

          {/* Create account */}
          <Route path="/signup">
            <AuthShell><SignupPage /></AuthShell>
          </Route>
          <Route path="/register">
            <AuthShell><SignupPage /></AuthShell>
          </Route>

          {/* Password reset */}
          <Route path="/reset">
            <AuthShell><ResetPage /></AuthShell>
          </Route>
          <Route path="/forgot">
            <AuthShell><ResetPage /></AuthShell>
          </Route>

          {/* Post-auth dashboard */}
          <Route path="/dashboard">
            <RequireAuth><DashboardPage /></RequireAuth>
          </Route>

          {/* 404 */}
          <Route>
            <AuthShell>
              <div className="rald-card" style={{ textAlign: "center", padding: "48px 32px" }}>
                <p style={{ color: "var(--muted)", marginBottom: 20, fontSize: 15 }}>Page not found.</p>
                <a href="/" style={{ color: "var(--green)" }}>← Back to sign in</a>
              </div>
            </AuthShell>
          </Route>
        </Switch>
      </Router>
    </AuthContext.Provider>
  );
}
