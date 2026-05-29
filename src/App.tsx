import { useState, useEffect, createContext, useContext } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { api, saveToken, clearToken, getToken, type AuthUser } from "./lib/api";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ForgotPage from "./pages/Forgot";
import DashboardPage from "./pages/Dashboard";
import Logo from "./components/Logo";

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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      background: "var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo size={52} />
        </div>
        {children}
        <p style={{
          textAlign: "center",
          fontSize: 11,
          color: "var(--text-muted)",
          marginTop: 28,
          lineHeight: 1.6,
        }}>
          Protected by RALD Identity · <a href="https://rald.cloud/privacy">Privacy</a> · <a href="https://rald.cloud/terms">Terms</a>
        </p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <span className="spinner" style={{ color: "var(--green)", width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
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
          <Route path="/login">
            <AuthShell><LoginPage /></AuthShell>
          </Route>
          <Route path="/register">
            <AuthShell><RegisterPage /></AuthShell>
          </Route>
          <Route path="/forgot">
            <AuthShell><ForgotPage /></AuthShell>
          </Route>
          <Route path="/">
            <RequireAuth><DashboardPage /></RequireAuth>
          </Route>
          <Route>
            <AuthShell>
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <h2 style={{ color: "var(--text-primary)", marginBottom: 8 }}>Page not found</h2>
                <a href="/login" style={{ color: "var(--green)" }}>Back to sign in</a>
              </div>
            </AuthShell>
          </Route>
        </Switch>
      </Router>
    </AuthContext.Provider>
  );
}
