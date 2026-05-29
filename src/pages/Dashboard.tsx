import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { api, clearToken } from "../lib/api";
import { useLocation } from "wouter";
import Logo from "../components/Logo";

type Session = { id: string; user_agent?: string; ip_address?: string; created_at: string };
type Device = { id: string; device_name?: string; device_type?: string; is_trusted?: boolean; last_seen_at: string };

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"account" | "sessions" | "devices">("account");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "sessions") {
      api.sessions().then((s) => setSessions(s as Session[])).catch(() => {});
    }
    if (tab === "devices") {
      api.devices().then((d) => setDevices(d as Device[])).catch(() => {});
    }
  }, [tab]);

  async function revokeSession(id: string) {
    setLoading(true);
    try {
      await api.revokeSession(id);
      setSessions((s) => s.filter((x) => x.id !== id));
    } finally {
      setLoading(false);
    }
  }

  async function revokeAll() {
    setLoading(true);
    try {
      await api.revokeAllSessions();
      clearToken();
      logout();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  async function removeDevice(id: string) {
    setLoading(true);
    try {
      await api.removeDevice(id);
      setDevices((d) => d.filter((x) => x.id !== id));
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    logout();
    navigate("/login");
  }

  const roleColor: Record<string, string> = {
    admin: "#FF3B30",
    operator: "#F4B400",
    merchant: "#2ECFA3",
    user: "var(--text-muted)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Logo size={32} />
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 16px",
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
        {/* User card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--green-dim)",
              border: "2px solid var(--green-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: "var(--green)",
            }}>
              {(user?.name ?? user?.email ?? "?")[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{user?.name}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{user?.email}</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span className="badge badge-green" style={{
                background: `${roleColor[user?.role ?? "user"]}18`,
                borderColor: `${roleColor[user?.role ?? "user"]}30`,
                color: roleColor[user?.role ?? "user"],
              }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: 24 }}>
          {(["account", "sessions", "devices"] as const).map((t) => (
            <button
              key={t}
              className={`tab-btn${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Account tab */}
        {tab === "account" && (
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Account details</h2>
            {[
              { label: "Full name", value: user?.name ?? "—" },
              { label: "Email", value: user?.email ?? "—" },
              { label: "Phone", value: user?.phone ?? "—" },
              { label: "Role", value: user?.role ?? "—" },
              { label: "Member since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "13px 0",
                borderBottom: "1px solid var(--border-subtle)",
              }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sessions tab */}
        {tab === "sessions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Active sessions</h2>
              <button
                onClick={revokeAll}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,59,48,0.3)",
                  borderRadius: 8,
                  padding: "7px 14px",
                  color: "#FF6B63",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Revoke all & sign out
              </button>
            </div>
            {sessions.length === 0 ? (
              <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                No active sessions found
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                        {s.user_agent?.split(" ")[0] ?? "Unknown device"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        IP: {s.ip_address ?? "unknown"} · {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => revokeSession(s.id)}
                      disabled={loading}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border)",
                        borderRadius: 7,
                        padding: "5px 12px",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Devices tab */}
        {tab === "devices" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Trusted devices</h2>
            {devices.length === 0 ? (
              <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                No devices registered
              </div>
            ) : (
              devices.map((d) => (
                <div key={d.id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                        {d.device_name ?? d.device_type ?? "Unknown device"}
                        {d.is_trusted && (
                          <span className="badge badge-green" style={{ marginLeft: 8 }}>Trusted</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Last seen: {new Date(d.last_seen_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeDevice(d.id)}
                      disabled={loading}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border)",
                        borderRadius: 7,
                        padding: "5px 12px",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
