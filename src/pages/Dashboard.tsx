import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../App";
import { api, clearToken, type ProfileData, type EcosystemApp, type SessionEntry, type DeviceEntry, type ActivityEntry, type ConnectedApp } from "../lib/api";
import { useLocation } from "wouter";

type Tab = "profile" | "apps" | "sessions" | "devices" | "activity";

const ICONS: Record<string, string> = {
  loop: "🎵", messenger: "💬", "rald-inbox": "📥", payrald: "💳",
  dunarald: "🛒", gitrald: "⚙️", raldtics: "📊", profiles: "👤",
};

function Avatar({ name, size = 48 }: { name: string | null; size?: number }) {
  const initials = (name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #004d85, #2EB67D)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, color: "#fff", flexShrink: 0,
      boxShadow: "0 0 0 2px rgba(46,182,125,.3)",
    }}>
      {initials}
    </div>
  );
}

function Badge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "#FF3B30", operator: "#F4B400", merchant: "#2EB67D", user: "#5A6A7A",
  };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      background: `${colors[role] ?? "#5A6A7A"}22`,
      border: `1px solid ${colors[role] ?? "#5A6A7A"}55`,
      color: colors[role] ?? "#8896A8",
    }}>{role}</span>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ profile, onUpdated }: { profile: ProfileData | null; onUpdated: () => void }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (profile) { setName(profile.name ?? ""); setBio(profile.bio ?? ""); }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr(""); setSaved(false);
    try {
      await api.updateProfile({ display_name: name.trim(), bio: bio.trim() });
      setSaved(true); onUpdated();
      setTimeout(() => setSaved(false), 2500);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally { setSaving(false); }
  }

  if (!profile) return <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Loading profile…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
          <Avatar name={profile.name} size={52} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{profile.name ?? "Anonymous"}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em" }}>{profile.rald_id}</div>
          </div>
          <Badge role={profile.role} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
          {[
            ["Email", profile.email],
            ["Phone", profile.phone ?? "—"],
            ["Member since", new Date(profile.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })],
            ["Identity hub", "profiles.rald.cloud"],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Display Name</label>
          <input
            className="rald-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="How should we call you?"
            maxLength={80}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Bio</label>
          <textarea
            style={{
              width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 14,
              fontFamily: "inherit", resize: "vertical", minHeight: 80, outline: "none",
            }}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A short bio (optional)"
            maxLength={300}
          />
        </div>
        {err && <div style={{ color: "var(--red)", fontSize: 13 }}>{err}</div>}
        {saved && <div style={{ color: "var(--green)", fontSize: 13 }}>✓ Profile saved</div>}
        <button type="submit" className="btn-primary" disabled={saving} style={{ maxWidth: 160 }}>
          {saving ? <span className="spinner" /> : "Save changes"}
        </button>
      </form>
    </div>
  );
}

// ── Apps Tab ──────────────────────────────────────────────────────────────────
function AppsTab({ apps, onLaunch }: { apps: EcosystemApp[]; onLaunch: (app: EcosystemApp) => void }) {
  const [launching, setLaunching] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function launch(app: EcosystemApp) {
    setErr(""); setLaunching(app.id);
    try {
      if (!app.provisioned) await api.provisionApp(app.id);
      try {
        const sso = await api.ssoExchange(app.id);
        const url = new URL(app.url);
        url.searchParams.set("rald_token", sso.token);
        url.searchParams.set("app_id", app.id);
        window.open(url.toString(), "_blank");
      } catch {
        window.open(app.url, "_blank");
      }
      onLaunch(app);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Launch failed");
    } finally { setLaunching(null); }
  }

  return (
    <div>
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {apps.filter(a => a.provisioned).length}/{apps.length} apps connected
        </span>
      </div>
      {err && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {apps.map(app => (
          <button
            key={app.id}
            onClick={() => launch(app)}
            disabled={launching === app.id}
            style={{
              background: app.provisioned ? "var(--surface)" : "var(--card)",
              border: `1px solid ${app.provisioned ? "var(--green-border)" : "var(--border)"}`,
              borderRadius: 14, padding: "14px 12px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              transition: "all 0.15s", textAlign: "center",
              opacity: launching === app.id ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: 26 }}>{ICONS[app.id] ?? "🔲"}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{app.name}</div>
              <div style={{ fontSize: 10, color: app.provisioned ? "var(--green)" : "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                {launching === app.id ? "Opening…" : app.provisioned ? "Connected" : "Click to connect"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────
function SessionsTab({ sessions, onRevokeAll }: { sessions: SessionEntry[]; onRevokeAll: () => void }) {
  const [local, setLocal] = useState<SessionEntry[]>(sessions);
  const [loading, setLoading] = useState(false);

  useEffect(() => setLocal(sessions), [sessions]);

  async function revoke(id: string) {
    setLoading(true);
    try { await api.revokeSession(id); setLocal(l => l.filter(s => s.id !== id)); }
    catch { /* best-effort */ } finally { setLoading(false); }
  }

  async function revokeAll() {
    setLoading(true);
    try { await api.revokeAllSessions(); onRevokeAll(); }
    catch { /* best-effort */ } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{local.length} active session{local.length !== 1 ? "s" : ""}</span>
        <button
          onClick={revokeAll} disabled={loading || local.length === 0}
          style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "5px 12px", color: "var(--red)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Revoke all
        </button>
      </div>
      {local.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>No active sessions</div>}
      {local.map(s => (
        <div key={s.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.user_agent?.split(" ").slice(-2).join(" ") ?? "Unknown browser"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {s.ip_address ?? "Unknown IP"} · {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
            </div>
          </div>
          <button onClick={() => revoke(s.id)} disabled={loading}
            style={{ flexShrink: 0, background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "4px 10px", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            Revoke
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Devices Tab ───────────────────────────────────────────────────────────────
function DevicesTab({ devices }: { devices: DeviceEntry[] }) {
  const [local, setLocal] = useState<DeviceEntry[]>(devices);
  const [loading, setLoading] = useState(false);

  useEffect(() => setLocal(devices), [devices]);

  async function remove(id: string) {
    setLoading(true);
    try { await api.removeDevice(id); setLocal(l => l.filter(d => d.id !== id)); }
    catch { /* best-effort */ } finally { setLoading(false); }
  }

  async function trust(id: string) {
    setLoading(true);
    try {
      await api.trustDevice(id);
      setLocal(l => l.map(d => d.id === id ? { ...d, is_trusted: true } : d));
    } catch { /* best-effort */ } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{local.length} device{local.length !== 1 ? "s" : ""} on record</div>
      {local.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>No devices on record</div>}
      {local.map(d => (
        <div key={d.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
              {d.device_type === "mobile" ? "📱" : "💻"} {d.device_name ?? d.device_type ?? "Unknown device"}
              {(d.is_trusted || d.trusted) && <span style={{ fontSize: 10, color: "var(--green)", background: "var(--green-dim)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "1px 7px" }}>Trusted</span>}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              Last seen {d.last_seen_at ? new Date(d.last_seen_at).toLocaleDateString() : "—"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {!(d.is_trusted || d.trusted) && (
              <button onClick={() => trust(d.id)} disabled={loading}
                style={{ background: "var(--green-dim)", border: "1px solid var(--green-border)", borderRadius: 7, padding: "4px 10px", color: "var(--green)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                Trust
              </button>
            )}
            <button onClick={() => remove(d.id)} disabled={loading}
              style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "4px 10px", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────
function ActivityTab({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0) return (
    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>No activity recorded</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {activity.slice(0, 40).map((a) => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 16 }}>{ICONS[a.app_id ?? ""] ?? (a.success ? "✅" : "❌")}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: a.success ? "var(--text)" : "var(--red)" }}>
              {a.app_id ? `Login via ${a.app_id}` : "Login"} {!a.success && "· Failed"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.ip_address ?? "—"} · {new Date(a.created_at).toLocaleString()}</div>
          </div>
          {a.country && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{a.country}</span>}
        </div>
      ))}
    </div>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("profile");

  const [profile,   setProfile]   = useState<ProfileData | null>(null);
  const [apps,      setApps]      = useState<EcosystemApp[]>([]);
  const [sessions,  setSessions]  = useState<SessionEntry[]>([]);
  const [devices,   setDevices]   = useState<DeviceEntry[]>([]);
  const [activity,  setActivity]  = useState<ActivityEntry[]>([]);
  const [connectedApps] = useState<ConnectedApp[]>([]);

  const loadProfile  = useCallback(() => api.profile().then(setProfile).catch(() => null), []);
  const loadApps     = useCallback(() => api.appLauncher().then(r => setApps(r.apps)).catch(() => null), []);
  const loadSessions = useCallback(() => api.sessions().then(setSessions).catch(() => null), []);
  const loadDevices  = useCallback(() => api.devices().then(setDevices).catch(() => null), []);
  const loadActivity = useCallback(() => api.activity().then(r => setActivity(r.activity)).catch(() => null), []);

  useEffect(() => { void loadProfile(); void loadApps(); }, [loadProfile, loadApps]);
  useEffect(() => {
    if (tab === "sessions") void loadSessions();
    if (tab === "devices")  void loadDevices();
    if (tab === "activity") void loadActivity();
  }, [tab, loadSessions, loadDevices, loadActivity]);

  function handleLogout() { clearToken(); logout(); navigate("/"); }
  function handleRevokeAll() { clearToken(); logout(); navigate("/"); }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "profile",  label: "Profile",  icon: "👤" },
    { id: "apps",     label: "Apps",     icon: "🚀" },
    { id: "sessions", label: "Sessions", icon: "🔑" },
    { id: "devices",  label: "Devices",  icon: "📱" },
    { id: "activity", label: "Activity", icon: "📋" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/rald-logo.png" style={{ width: 28, height: 28, objectFit: "contain" }} alt="RALD" />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em" }}>RALD</span>
          <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: 20, padding: "2px 10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>profiles</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={user?.name ?? null} size={28} />
          <button
            onClick={handleLogout}
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", color: "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* ── User hero ─────────────────────────────────────────────────────── */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "20px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 30px rgba(0,0,0,.3)" }}>
          <Avatar name={profile?.name ?? user?.name ?? null} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>{profile?.name ?? user?.name ?? "RALD User"}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{user?.email}</div>
            {profile?.rald_id && <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, letterSpacing: "0.04em", marginTop: 3 }}>{profile.rald_id}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <Badge role={user?.role ?? "user"} />
            {apps.length > 0 && (
              <div style={{ fontSize: 10, color: "var(--muted)" }}>
                {apps.filter(a => a.provisioned).length} / {apps.length} apps
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface)", borderRadius: 12, padding: 4, border: "1px solid var(--border)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "8px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                background: tab === t.id ? "var(--card)" : "transparent",
                boxShadow: tab === t.id ? "0 1px 6px rgba(0,0,0,.4)" : "none",
                color: tab === t.id ? "var(--text)" : "var(--muted)",
                transition: "all 0.15s",
              }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────────────────────────────────── */}
        {tab === "profile"  && <ProfileTab  profile={profile}  onUpdated={loadProfile} />}
        {tab === "apps"     && <AppsTab     apps={apps}        onLaunch={() => void loadApps()} />}
        {tab === "sessions" && <SessionsTab sessions={sessions} onRevokeAll={handleRevokeAll} />}
        {tab === "devices"  && <DevicesTab  devices={devices} />}
        {tab === "activity" && <ActivityTab activity={activity} />}
      </div>
    </div>
  );
}
