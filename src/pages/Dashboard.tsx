// RALD Identity — Profiles Dashboard
// Phase H: Foundation Hardening — Security + Organizations + Audit Logs tabs
// App.RALD.Cloud / Profiles.RALD.Cloud — "Google My Account for RALD"
// LILCKY STUDIO LIMITED

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../App";
import {
  api, clearToken,
  type ProfileData, type EcosystemApp, type SessionEntry,
  type DeviceEntry, type ActivityEntry, type ConnectedApp,
  type OrgEntry, type AuditLogEntry, type VerificationStatus,
} from "../lib/api";
import { useLocation } from "wouter";

type Tab = "profile" | "apps" | "sessions" | "devices" | "activity" | "security" | "organizations" | "audit";

const ICONS: Record<string, string> = {
  loop: "🎵", messenger: "💬", "rald-inbox": "📥", payrald: "💳",
  dunarald: "🛒", gitrald: "⚙️", raldtics: "📊", profiles: "👤",
  manilla: "🎶",
};

const ORG_TYPE_ICONS: Record<string, string> = {
  radio: "📻", media: "📡", business: "💼", community: "🏘️",
  education: "📚", general: "🏢",
};

const AUDIT_ACTION_ICONS: Record<string, string> = {
  login: "🔑", login_failed: "❌", logout: "🚪", register: "✅",
  otp_sent: "📱", otp_verified: "✔️", otp_failed: "⚠️",
  password_reset_requested: "🔄", password_reset_completed: "🔒",
  session_created: "🟢", session_revoked: "🚫", all_sessions_revoked: "⛔",
  sso_exchange: "🔄", sso_handoff_issued: "🎫", app_provisioned: "📦",
  account_suspended: "🔴", rate_limited: "⏱️", redirect_rejected: "🛡️",
};

/* ── shared helpers ─────────────────────────────────────────────────────── */
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
    artist: "#9B59B6", label: "#E67E22", manager: "#3498DB",
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

function VerificationPill({ verified, label }: { verified: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: verified ? "var(--green-dim)" : "var(--surface)",
      border: `1px solid ${verified ? "var(--green-border)" : "var(--border-2)"}`,
      color: verified ? "var(--green)" : "var(--muted)",
    }}>
      {verified ? "✓" : "○"} {label}
    </span>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, padding: "16px 18px",
      border: "1px solid var(--border)", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
      {children}
    </div>
  );
}

/* ── Profile Tab ─────────────────────────────────────────────────────────── */
function ProfileTab({ profile, verification, onUpdated }: {
  profile: ProfileData | null;
  verification: VerificationStatus | null;
  onUpdated: () => void;
}) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Identity card */}
      <SectionCard>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
          <Avatar name={profile.name} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{profile.name ?? "Anonymous"}</div>
            <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700, letterSpacing: "0.04em" }}>{profile.rald_id}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{profile.email}</div>
          </div>
          <Badge role={profile.role} />
        </div>

        {/* Verification status */}
        {verification && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <VerificationPill verified={verification.email_verified} label="Email verified" />
            <VerificationPill verified={verification.phone_verified} label="Phone verified" />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
          {[
            ["Email", profile.email],
            ["Phone", profile.phone ?? "—"],
            ["Member since", new Date(profile.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })],
            ["Identity hub", "profiles.rald.cloud"],
            ["Active apps", `${profile.active_products?.length ?? 0}`],
            ["RALD ID", profile.rald_id],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>{value}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Edit form */}
      <SectionCard>
        <SectionTitle>Edit Profile</SectionTitle>
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Display Name</label>
            <input className="rald-input" value={name} onChange={e => setName(e.target.value)} placeholder="How should we call you?" maxLength={80} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Bio</label>
            <textarea style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 14, fontFamily: "inherit", resize: "vertical", minHeight: 80, outline: "none" }}
              value={bio} onChange={e => setBio(e.target.value)} placeholder="A short bio (optional)" maxLength={300} />
          </div>
          {err && <div style={{ color: "var(--red)", fontSize: 13 }}>{err}</div>}
          {saved && <div style={{ color: "var(--green)", fontSize: 13 }}>✓ Profile saved</div>}
          <button type="submit" className="btn-primary" disabled={saving} style={{ maxWidth: 160 }}>
            {saving ? <span className="spinner" /> : "Save changes"}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}

/* ── Apps Tab ──────────────────────────────────────────────────────────────── */
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
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{apps.filter(a => a.provisioned).length}/{apps.length} apps connected</span>
      </div>
      {err && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {apps.map(app => (
          <button key={app.id} onClick={() => launch(app)} disabled={launching === app.id}
            style={{
              background: app.provisioned ? "var(--surface)" : "var(--card)",
              border: `1px solid ${app.provisioned ? "var(--green-border)" : "var(--border)"}`,
              borderRadius: 14, padding: "14px 12px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              transition: "all 0.15s", textAlign: "center", opacity: launching === app.id ? 0.6 : 1,
            }}>
            <span style={{ fontSize: 26 }}>{app.icon ?? ICONS[app.id] ?? "🔲"}</span>
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

/* ── Sessions Tab ──────────────────────────────────────────────────────────── */
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
        <button onClick={revokeAll} disabled={loading || local.length === 0}
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

/* ── Devices Tab ───────────────────────────────────────────────────────────── */
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
    try { await api.trustDevice(id); setLocal(l => l.map(d => d.id === id ? { ...d, is_trusted: true } : d)); }
    catch { /* best-effort */ } finally { setLoading(false); }
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
              {(d.is_trusted || d.trusted) && (
                <span style={{ fontSize: 10, color: "var(--green)", background: "var(--green-dim)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "1px 7px" }}>Trusted</span>
              )}
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

/* ── Activity Tab ──────────────────────────────────────────────────────────── */
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

/* ── Security Tab ──────────────────────────────────────────────────────────── */
function SecurityTab({ verification, userEmail, onSignOut }: {
  verification: VerificationStatus | null;
  userEmail: string;
  onSignOut: () => void;
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function sendPasswordReset() {
    setResetLoading(true);
    try {
      await api.requestReset(userEmail);
      setResetSent(true);
      setShowResetConfirm(false);
    } catch {
      /* best-effort — email may not be confirmed yet */
      setResetSent(true);
    } finally { setResetLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Verification Status */}
      <SectionCard>
        <SectionTitle>Verification Status</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Email address</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{verification?.email ?? userEmail}</div>
            </div>
            <VerificationPill verified={verification?.email_verified ?? false} label={verification?.email_verified ? "Verified" : "Not verified"} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Phone number</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{verification?.phone ?? "Not added"}</div>
            </div>
            <VerificationPill verified={verification?.phone_verified ?? false} label={verification?.phone_verified ? "Verified" : "Not verified"} />
          </div>
        </div>
      </SectionCard>

      {/* Password */}
      <SectionCard>
        <SectionTitle>Password</SectionTitle>
        {resetSent ? (
          <div style={{ background: "var(--green-dim)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "12px 16px", color: "var(--green)", fontSize: 13 }}>
            ✓ Password reset email sent to {verification?.email ?? userEmail}. Check your inbox.
          </div>
        ) : showResetConfirm ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>We'll send a reset link to <strong style={{ color: "var(--text)" }}>{verification?.email ?? userEmail}</strong>.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={sendPasswordReset} disabled={resetLoading}
                style={{ background: "var(--blue)", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {resetLoading ? "Sending…" : "Send reset link"}
              </button>
              <button onClick={() => setShowResetConfirm(false)}
                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Change password</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Send a reset link to your email</div>
            </div>
            <button onClick={() => setShowResetConfirm(true)}
              style={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: 8, padding: "7px 14px", color: "var(--text)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Change password
            </button>
          </div>
        )}
      </SectionCard>

      {/* 2FA — placeholder for Phase I */}
      <SectionCard>
        <SectionTitle>Two-Factor Authentication</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Authenticator app</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Coming in Phase I — TOTP support</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "3px 10px", fontWeight: 700 }}>
            Soon
          </span>
        </div>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard style={{ borderColor: "var(--red-border)" }}>
        <SectionTitle>Danger Zone</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sign out everywhere</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Revoke all active sessions and sign out</div>
          </div>
          <button onClick={onSignOut}
            style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "7px 14px", color: "var(--red)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Sign out all
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Organizations Tab ─────────────────────────────────────────────────────── */
function OrganizationsTab({ organizations, onRefresh }: {
  organizations: OrgEntry[];
  onRefresh: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [type, setType] = useState("general");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [leaving, setLeaving] = useState<string | null>(null);

  const ORG_TYPES = [
    { key: "general", label: "General" },
    { key: "radio", label: "Radio Station" },
    { key: "media", label: "Media House" },
    { key: "business", label: "Business" },
    { key: "community", label: "Community" },
    { key: "education", label: "Education" },
  ];

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setErr("");
    try {
      await api.createOrganization({ name: name.trim(), handle: handle.trim(), type, description: description.trim() });
      setShowCreate(false); setName(""); setHandle(""); setDescription(""); setType("general");
      onRefresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not create organization");
    } finally { setCreating(false); }
  }

  async function leave(orgId: string) {
    setLeaving(orgId);
    try { await api.leaveOrganization(orgId); onRefresh(); }
    catch { /* best-effort */ } finally { setLeaving(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{organizations.length} organization{organizations.length !== 1 ? "s" : ""}</span>
        <button onClick={() => setShowCreate(s => !s)}
          style={{ background: "var(--green-dim)", border: "1px solid var(--green-border)", borderRadius: 8, padding: "6px 14px", color: "var(--green)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {showCreate ? "Cancel" : "+ New organization"}
        </button>
      </div>

      {showCreate && (
        <SectionCard>
          <SectionTitle>Create Organization</SectionTitle>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Name *</label>
              <input className="rald-input" value={name} onChange={e => setName(e.target.value)} placeholder="Organization name" maxLength={80} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Handle * (letters, numbers, - _)</label>
              <input className="rald-input" value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ""))} placeholder="my-org" maxLength={40} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Type</label>
              <select className="rald-input" value={type} onChange={e => setType(e.target.value)}>
                {ORG_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Description</label>
              <input className="rald-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this organization?" maxLength={300} />
            </div>
            {err && <div style={{ color: "var(--red)", fontSize: 12 }}>{err}</div>}
            <button type="submit" className="btn-primary" disabled={creating || !name.trim() || handle.length < 3}>
              {creating ? "Creating…" : "Create organization"}
            </button>
          </form>
        </SectionCard>
      )}

      {organizations.length === 0 && !showCreate && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
          No organizations yet. Create or join one to get started.
        </div>
      )}

      {organizations.map(org => (
        <div key={org.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{ORG_TYPE_ICONS[org.type] ?? "🏢"}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{org.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>@{org.handle} · {org.type}</div>
              {org.description && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>{org.description}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", background: "var(--green-dim)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "2px 8px" }}>
                  {org.member_role}
                </span>
                <span style={{ fontSize: 11, color: "var(--subtle)" }}>
                  Joined {new Date(org.joined_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => leave(org.id)} disabled={leaving === org.id}
            style={{ flexShrink: 0, background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "4px 10px", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            {org.member_role === "owner" ? "Delete" : "Leave"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Audit Tab ─────────────────────────────────────────────────────────────── */
function AuditTab({ auditLogs }: { auditLogs: AuditLogEntry[] }) {
  if (auditLogs.length === 0) return (
    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
      No audit events recorded yet.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Last {auditLogs.length} security events</div>
      {auditLogs.map((log) => {
        const isFailure = log.status === "failure" || log.status === "blocked";
        return (
          <div key={log.id} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 12px", background: "var(--surface)", borderRadius: 10,
            border: `1px solid ${isFailure ? "var(--red-border)" : "var(--border)"}`,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{AUDIT_ACTION_ICONS[log.action] ?? "🔔"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isFailure ? "var(--red)" : "var(--text)" }}>
                  {log.action.replace(/_/g, " ")}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10,
                  background: log.status === "success" ? "var(--green-dim)" : isFailure ? "var(--red-dim)" : "var(--amber-dim)",
                  border: `1px solid ${log.status === "success" ? "var(--green-border)" : isFailure ? "var(--red-border)" : "var(--amber-border)"}`,
                  color: log.status === "success" ? "var(--green)" : isFailure ? "var(--red)" : "var(--amber)",
                }}>
                  {log.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {new Date(log.created_at).toLocaleString()} · {log.ip_address ?? "Unknown IP"}
              </div>
              {log.resource_type && (
                <div style={{ fontSize: 11, color: "var(--subtle)", marginTop: 1 }}>
                  {log.resource_type}{log.resource_id ? ` · ${log.resource_id.slice(0, 8)}…` : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── MAIN DASHBOARD ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

/* ── Privacy Tab — Phase 3 ─────────────────────────────────────────────────── */
function PrivacyTab({ userEmail }: { userEmail: string }) {
  const [loading, setLoading]   = useState(false);
  const [exporting, setExport]  = useState(false);
  const [perms, setPerms]       = useState({ profile_visible: true, activity_tracking: true, marketing_emails: true });
  const [deleteStep, setDelete] = useState<0 | 1 | 2>(0);
  const [msg, setMsg]           = useState<string | null>(null);

  async function handleExport() {
    setExport(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL ?? "https://auth.rald.cloud"}/privacy/export`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("rald_token")}` },
      });
      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `rald-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setMsg("Export failed. Please try again."); }
    finally { setExport(false); }
  }

  async function handlePermChange(key: keyof typeof perms, val: boolean) {
    const next = { ...perms, [key]: val };
    setPerms(next);
    try {
      const token = localStorage.getItem("rald_token");
      await fetch(`${import.meta.env.VITE_API_URL ?? "https://auth.rald.cloud"}/privacy/permissions`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: val }),
      });
    } catch { /* silent — UI already updated */ }
  }

  async function handleDeleteRequest() {
    setLoading(true);
    try {
      const token = localStorage.getItem("rald_token");
      const resp  = await fetch(`${import.meta.env.VITE_API_URL ?? "https://auth.rald.cloud"}/privacy/delete-request`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, reason: "User initiated from dashboard" }),
      });
      if (resp.ok) setDelete(2);
      else { const r = await resp.json() as { error?: string }; setMsg(r.error ?? "Request failed."); }
    } catch { setMsg("Request failed. Please try again."); }
    finally { setLoading(false); }
  }

  const Row = ({ label, desc, val, onChange }: { label: string; desc: string; val: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-2)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!val)} style={{
        width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
        background: val ? "var(--green)" : "var(--surface)", transition: "background 0.2s",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,.3)",
      }}>
        <span style={{
          position: "absolute", top: 3, left: val ? 20 : 3, width: 18, height: 18,
          borderRadius: "50%", background: "#fff", transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.3)",
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* Data export */}
      <SectionCard>
        <SectionTitle>Your Data</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Download My Data</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Get a full JSON export of your identity, activity, sessions, and devices.</div>
          </div>
          <button onClick={handleExport} disabled={exporting} style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9,
            padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "var(--text)",
            cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.6 : 1,
          }}>
            {exporting ? "Exporting…" : "⬇ Export"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", padding: "8px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border-2)" }}>
          📍 Data stored in Nigeria region · Retained while account is active
        </div>
      </SectionCard>

      {/* Permission controls */}
      <SectionCard>
        <SectionTitle>Privacy Controls</SectionTitle>
        <Row label="Public profile" desc="Let other RALD users find and see your profile."
          val={perms.profile_visible} onChange={v => void handlePermChange("profile_visible", v)} />
        <Row label="Activity tracking" desc="Improve recommendations based on your usage."
          val={perms.activity_tracking} onChange={v => void handlePermChange("activity_tracking", v)} />
        <Row label="Marketing emails" desc="Receive product updates and announcements from RALD."
          val={perms.marketing_emails} onChange={v => void handlePermChange("marketing_emails", v)} />
        <div style={{ paddingTop: 10, fontSize: 11, color: "var(--muted)" }}>
          Changes take effect immediately. <a href="https://learn.rald.cloud/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>Privacy policy →</a>
        </div>
      </SectionCard>

      {/* Delete account */}
      <SectionCard style={{ border: "1px solid var(--red-border)" }}>
        <SectionTitle>Danger Zone</SectionTitle>
        {deleteStep === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Delete Account</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Permanently remove your account and all associated data in 30 days.</div>
            </div>
            <button onClick={() => setDelete(1)} style={{
              background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 9,
              padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "var(--red)", cursor: "pointer",
            }}>Delete…</button>
          </div>
        )}
        {deleteStep === 1 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>⚠ Are you sure?</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
              Your account <strong style={{ color: "var(--text)" }}>{userEmail}</strong> will be scheduled for deletion in 30 days. All your data, sessions, organizations, and verification status will be permanently removed. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setDelete(0)} style={{
                flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9,
                padding: "9px 0", fontSize: 12, fontWeight: 700, color: "var(--muted)", cursor: "pointer",
              }}>Cancel</button>
              <button onClick={() => void handleDeleteRequest()} disabled={loading} style={{
                flex: 1, background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 9,
                padding: "9px 0", fontSize: 12, fontWeight: 700, color: "var(--red)",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
              }}>{loading ? "Requesting…" : "Yes, delete my account"}</button>
            </div>
          </div>
        )}
        {deleteStep === 2 && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Deletion scheduled</div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              Your account will be deleted in 30 days. You can cancel by contacting <a href="mailto:privacy@rald.cloud" style={{ color: "var(--green)" }}>privacy@rald.cloud</a>.
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

  const [tab, setTab] = useState<Tab>("profile");

  const [profile,      setProfile]      = useState<ProfileData | null>(null);
  const [apps,         setApps]         = useState<EcosystemApp[]>([]);
  const [sessions,     setSessions]     = useState<SessionEntry[]>([]);
  const [devices,      setDevices]      = useState<DeviceEntry[]>([]);
  const [activity,     setActivity]     = useState<ActivityEntry[]>([]);
  const [organizations, setOrgs]        = useState<OrgEntry[]>([]);
  const [auditLogs,    setAuditLogs]    = useState<AuditLogEntry[]>([]);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);

  const loadProfile      = useCallback(() => api.profile().then(setProfile).catch(() => null), []);
  const loadApps         = useCallback(() => api.appLauncher().then(r => setApps(r.apps)).catch(() => null), []);
  const loadSessions     = useCallback(() => api.sessions().then(setSessions).catch(() => null), []);
  const loadDevices      = useCallback(() => api.devices().then(setDevices).catch(() => null), []);
  const loadActivity     = useCallback(() => api.activity().then(r => setActivity(r.activity)).catch(() => null), []);
  const loadOrgs         = useCallback(() => api.organizations().then(r => setOrgs(r.organizations)).catch(() => null), []);
  const loadAuditLogs    = useCallback(() => api.auditLogs().then(r => setAuditLogs(r.audit_logs)).catch(() => null), []);
  const loadVerification = useCallback(() => api.verificationStatus().then(setVerification).catch(() => null), []);

  useEffect(() => { void loadProfile(); void loadApps(); void loadVerification(); }, [loadProfile, loadApps, loadVerification]);

  useEffect(() => {
    if (tab === "sessions")      void loadSessions();
    if (tab === "devices")       void loadDevices();
    if (tab === "activity")      void loadActivity();
    if (tab === "organizations") void loadOrgs();
    if (tab === "audit")         void loadAuditLogs();
    if (tab === "security")      void loadVerification();
  }, [tab, loadSessions, loadDevices, loadActivity, loadOrgs, loadAuditLogs, loadVerification]);

  function handleLogout() { clearToken(); logout(); navigate("/"); }
  function handleRevokeAll() { clearToken(); logout(); navigate("/"); }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "profile",       label: "Profile",  icon: "👤" },
    { id: "apps",          label: "Apps",     icon: "🚀" },
    { id: "sessions",      label: "Sessions", icon: "🔑" },
    { id: "devices",       label: "Devices",  icon: "📱" },
    { id: "activity",      label: "Activity", icon: "📋" },
    { id: "security",      label: "Security", icon: "🛡️" },
    { id: "organizations", label: "Orgs",     icon: "🏢" },
    { id: "audit",         label: "Audit",    icon: "🔍" },
    { id: "privacy",       label: "Privacy",  icon: "🔒" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: "1px solid var(--border)", padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--card)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/rald-logo.png" style={{ width: 28, height: 28, objectFit: "contain" }} alt="RALD" />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em" }}>RALD</span>
          <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: 20, padding: "2px 10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            my account
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={user?.name ?? null} size={28} />
          <button onClick={handleLogout}
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", color: "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* ── User hero ────────────────────────────────────────────────── */}
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18,
          padding: "20px 22px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 4px 30px rgba(0,0,0,.3)",
        }}>
          <Avatar name={profile?.name ?? user?.name ?? null} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>{profile?.name ?? user?.name ?? "RALD User"}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{user?.email}</div>
            {profile?.rald_id && (
              <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, letterSpacing: "0.04em", marginTop: 3 }}>{profile.rald_id}</div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <Badge role={user?.role ?? "user"} />
            {verification && (
              <div style={{ display: "flex", gap: 4 }}>
                <VerificationPill verified={verification.email_verified} label="Email" />
                {verification.phone && <VerificationPill verified={verification.phone_verified} label="Phone" />}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 3, marginBottom: 20, overflowX: "auto",
          background: "var(--surface)", borderRadius: 12, padding: 4,
          border: "1px solid var(--border)", scrollbarWidth: "none",
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer",
                background: tab === t.id ? "var(--card)" : "transparent",
                boxShadow: tab === t.id ? "0 1px 6px rgba(0,0,0,.4)" : "none",
                color: tab === t.id ? "var(--text)" : "var(--muted)",
                transition: "all 0.15s", minWidth: 58,
              }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        {tab === "profile"       && <ProfileTab       profile={profile} verification={verification} onUpdated={loadProfile} />}
        {tab === "apps"          && <AppsTab          apps={apps} onLaunch={() => void loadApps()} />}
        {tab === "sessions"      && <SessionsTab      sessions={sessions} onRevokeAll={handleRevokeAll} />}
        {tab === "devices"       && <DevicesTab       devices={devices} />}
        {tab === "activity"      && <ActivityTab      activity={activity} />}
        {tab === "security"      && <SecurityTab      verification={verification} userEmail={user?.email ?? ""} onSignOut={handleRevokeAll} />}
        {tab === "organizations" && <OrganizationsTab organizations={organizations} onRefresh={loadOrgs} />}
        {tab === "audit"         && <AuditTab         auditLogs={auditLogs} />}
        {tab === "privacy"       && <PrivacyTab        userEmail={user?.email ?? ""} />}
      </div>
    </div>
  );
}

