// RALD Identity — Profiles Dashboard
// Phase 2: Full Account Center — Google My Account quality
// App.RALD.Cloud — Connected Apps, Verification, Settings added
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

type Tab = "profile" | "connected" | "verification" | "sessions" | "devices" | "activity" | "security" | "organizations" | "audit" | "privacy" | "settings";

const ICONS: Record<string, string> = {
  loop: "🎵", messenger: "💬", "rald-inbox": "📥", payrald: "💳",
  dunarald: "🛒", gitrald: "⚙️", raldtics: "📊", profiles: "👤",
  manilla: "🎶", mail: "✉️", voice: "🎙️",
};

const PRODUCT_COLORS: Record<string, string> = {
  manilla:   "#FF7A00",
  loop:      "#00FF88",
  messenger: "#00BFFF",
  voice:     "#FF4FAD",
  mail:      "#0066FF",
  dunarald:  "#A855F7",
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

/* ── Shared helpers ──────────────────────────────────────────────────────── */
function Avatar({ name, size = 48 }: { name: string | null; size?: number }) {
  const initials = (name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #004d85, #2EB67D)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, color: "#fff", flexShrink: 0,
      boxShadow: "0 0 0 2px rgba(46,182,125,.3)",
    }}>{initials}</div>
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
    }}>{verified ? "✓" : "○"} {label}</span>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, padding: "16px 18px",
      border: "1px solid var(--border)", ...style,
    }}>{children}</div>
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
    setSaving(true); setSaved(false); setErr("");
    try {
      await api.updateProfile({ display_name: name, bio });
      setSaved(true); onUpdated();
      setTimeout(() => setSaved(false), 3000);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard>
        <SectionTitle>Identity</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>RALD ID</div>
              <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.08em" }}>{profile?.rald_id ?? "—"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Email</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{profile?.email ?? "—"}</div>
            </div>
            <VerificationPill verified={verification?.email_verified ?? false} label={verification?.email_verified ? "Verified" : "Not verified"} />
          </div>
          {profile?.phone && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Phone</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{profile.phone}</div>
              </div>
              <VerificationPill verified={verification?.phone_verified ?? false} label={verification?.phone_verified ? "Verified" : "Not verified"} />
            </div>
          )}
          <div style={{ padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Role</div>
            <div style={{ marginTop: 4 }}><Badge role={profile?.role ?? "user"} /></div>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>Public Profile</SectionTitle>
        <form onSubmit={e => void save(e)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

      {profile?.active_products && profile.active_products.length > 0 && (
        <SectionCard>
          <SectionTitle>Active Products</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile.active_products.map(p => (
              <span key={p} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "var(--card)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
                {ICONS[p] ?? "🔲"} {p}
              </span>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ── Connected Apps Tab ─────────────────────────────────────────────────── */
const ECOSYSTEM_APPS = [
  { id: "manilla",   name: "Manilla",     icon: "🎶", color: "#FF7A00", url: "https://manilla.rald.cloud",   learn: "https://learn.rald.cloud/products/manilla",  desc: "Music streaming & discovery" },
  { id: "loop",      name: "Loop",        icon: "🎵", color: "#00FF88", url: "https://loop.rald.cloud",      learn: "https://learn.rald.cloud/products/loop",     desc: "Creator marketplace & commerce" },
  { id: "messenger", name: "Messenger",   icon: "💬", color: "#00BFFF", url: "https://messenger.rald.cloud", learn: "https://learn.rald.cloud/products/messenger", desc: "Encrypted messaging" },
  { id: "voice",     name: "Loop Voice",  icon: "🎙️", color: "#FF4FAD", url: "https://voice.rald.cloud",     learn: "https://learn.rald.cloud/products/voice",    desc: "SIP-based voice communications" },
  { id: "mail",      name: "RALD Mail",   icon: "✉️", color: "#0066FF", url: "https://mail.rald.cloud",      learn: "https://learn.rald.cloud/products/mail",     desc: "Private email for the ecosystem" },
  { id: "dunarald",  name: "DunaRald",    icon: "🛒", color: "#A855F7", url: "https://dunarald.rald.cloud",  learn: "https://learn.rald.cloud/products/dunarald", desc: "Digital content marketplace" },
];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  manilla:   ["Read your profile", "Stream content", "Follow artists"],
  loop:      ["Read your profile", "Post as you", "Access wallet"],
  messenger: ["Read your profile", "Send messages", "Access contacts"],
  voice:     ["Read your profile", "Make & receive calls", "Access call logs"],
  mail:      ["Read your profile", "Send & receive email", "Manage mailbox"],
  dunarald:  ["Read your profile", "Make purchases", "Access library"],
};

function ConnectedAppsTab({ apps, provisionedIds, onRefresh }: {
  apps: ConnectedApp[];
  provisionedIds: string[];
  onRefresh: () => void;
}) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function launch(appDef: typeof ECOSYSTEM_APPS[0]) {
    setErr(""); setLaunching(appDef.id);
    try {
      if (!provisionedIds.includes(appDef.id)) await api.provisionApp(appDef.id);
      try {
        const sso = await api.ssoExchange(appDef.id);
        const url = new URL(appDef.url);
        url.searchParams.set("rald_token", sso.token);
        url.searchParams.set("app_id", appDef.id);
        window.open(url.toString(), "_blank");
      } catch { window.open(appDef.url, "_blank"); }
      onRefresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Launch failed");
    } finally { setLaunching(null); }
  }

  async function revoke(appId: string) {
    setRevoking(appId);
    try {
      // Revoke all sessions for this app via session revoke — best effort
      await api.revokeAllSessions();
      onRefresh();
    } catch { /* best-effort */ } finally { setRevoking(null); }
  }

  const connectedMap = Object.fromEntries(apps.map(a => [a.app_id, a]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {err && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 4 }}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
        {provisionedIds.length} of {ECOSYSTEM_APPS.length} apps connected · <a href="https://learn.rald.cloud" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 12 }}>Learn about all products →</a>
      </div>
      {ECOSYSTEM_APPS.map(app => {
        const connected = connectedMap[app.id];
        const isProvisioned = provisionedIds.includes(app.id);
        const color = app.color;
        const defaultPerms = DEFAULT_PERMISSIONS[app.id] ?? [];
        const perms = connected?.role ? [connected.role, ...defaultPerms.slice(1)] : defaultPerms;
        return (
          <div key={app.id} style={{
            background: "var(--surface)", borderRadius: 14,
            border: `1px solid ${isProvisioned ? color + "25" : "var(--border)"}`,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${color}15`, border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>{app.icon}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{app.name}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    background: isProvisioned ? `${color}15` : "var(--card)",
                    border: `1px solid ${isProvisioned ? color + "40" : "var(--border)"}`,
                    color: isProvisioned ? color : "var(--muted)",
                  }}>{isProvisioned ? "● Connected" : "○ Not connected"}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{app.desc}</div>

                {/* Permissions */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Permissions</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {perms.map(p => (
                      <span key={p} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>{p}</span>
                    ))}
                  </div>
                </div>

                {/* Last accessed */}
                {connected?.connected && (
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10 }}>
                    Connected {new Date(connected.connected).toLocaleDateString()}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => void launch(app)} disabled={launching === app.id}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      background: isProvisioned ? `${color}15` : color,
                      border: `1px solid ${color}50`,
                      color: isProvisioned ? color : "#000",
                      opacity: launching === app.id ? 0.6 : 1,
                    }}>
                    {launching === app.id ? "Opening…" : isProvisioned ? "Open →" : "Connect"}
                  </button>
                  <a href={app.learn} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)", textDecoration: "none" }}>
                    Learn more
                  </a>
                  {isProvisioned && (
                    <button onClick={() => void revoke(app.id)} disabled={revoking === app.id}
                      style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "none", border: "1px solid var(--border)", color: "var(--red)", opacity: revoking === app.id ? 0.6 : 1 }}>
                      {revoking === app.id ? "Revoking…" : "Revoke"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Verification Tab ────────────────────────────────────────────────────── */
function VerificationTab({ verification }: { verification: VerificationStatus | null }) {
  const [applications, setApplications] = useState<Array<{
    id: string; verification_type: string; status: string; name: string;
    description?: string; submitted_at: string; reviewed_at?: string;
  }>>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    api.verifications()
      .then(r => setApplications(r.verifications))
      .catch(() => setApplications([]))
      .finally(() => setLoadingApps(false));
  }, []);

  const tiers = [
    { label: "Basic",            icon: "✉", verified: !!(verification?.email_verified), desc: "Email verified",    color: "#6B7A8D" },
    { label: "Phone Verified",   icon: "📱", verified: !!(verification?.phone_verified), desc: "Phone verified",    color: "#00BFFF" },
    { label: "Identity Verified",icon: "✓",  verified: false,                            desc: "Government ID",     color: "#00E5FF" },
    { label: "Business Verified",icon: "⬡",  verified: false,                            desc: "CAC registration",  color: "#00FF88" },
  ];

  const statusColors: Record<string, string> = {
    approved: "#00FF88", pending: "#FFD400", rejected: "#FF2E2E", withdrawn: "#6B7A8D",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Current verification tier */}
      <SectionCard>
        <SectionTitle>Verification Tiers</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tiers.map((t, i) => (
            <div key={t.label} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
              borderRadius: 10, background: "var(--card)", border: `1px solid ${t.verified ? t.color + "35" : "var(--border)"}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: t.verified ? `${t.color}20` : "var(--surface)",
                border: `1px solid ${t.verified ? t.color + "50" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: t.verified ? t.color : "var(--muted)",
              }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.verified ? "var(--text)" : "var(--muted)" }}>Tier {i + 1} — {t.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{t.desc}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                background: t.verified ? `${t.color}15` : "var(--surface)",
                border: `1px solid ${t.verified ? t.color + "40" : "var(--border)"}`,
                color: t.verified ? t.color : "var(--muted)",
              }}>{t.verified ? "✓ Done" : "Not yet"}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
            Higher verification tiers unlock more ecosystem features. <a href="https://trust.rald.cloud/verification" target="_blank" rel="noopener noreferrer" style={{ color: "#00E5FF" }}>Full verification policy →</a>
          </div>
        </div>
      </SectionCard>

      {/* Professional verification applications */}
      <SectionCard>
        <SectionTitle>Professional Verification Applications</SectionTitle>
        {loadingApps ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>Loading…</div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
              Apply for professional verification as an Artist, Label, Radio Station, or Business. Approved applications receive a verification badge visible across all RALD products.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["Artist", "Label", "Radio Station", "Advertiser", "Media House", "Community"].map(type => (
                <a key={type} href="https://app.rald.cloud/verify" style={{
                  padding: "6px 16px", borderRadius: 30, fontSize: 11, fontWeight: 700,
                  background: "var(--card)", border: "1px solid var(--border-2)", color: "var(--text)", textDecoration: "none",
                }}>{type}</a>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {applications.map(app => (
              <div key={app.id} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{app.verification_type} — {app.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Submitted {new Date(app.submitted_at).toLocaleDateString()}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  color: statusColors[app.status] ?? "var(--muted)",
                  background: `${statusColors[app.status] ?? "var(--muted)"}15`,
                  border: `1px solid ${statusColors[app.status] ?? "var(--muted)"}30`,
                  textTransform: "capitalize",
                }}>{app.status}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
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
            <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
            <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
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
      {activity.slice(0, 50).map((a) => (
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
  verification: VerificationStatus | null; userEmail: string; onSignOut: () => void;
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function sendPasswordReset() {
    setResetLoading(true);
    try { await api.requestReset(userEmail); setResetSent(true); setShowResetConfirm(false); }
    catch { setResetSent(true); }
    finally { setResetLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard>
        <SectionTitle>Verification Status</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

      <SectionCard>
        <SectionTitle>Two-Factor Authentication</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Authenticator app (TOTP)</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Phase I — Google Authenticator, Authy compatible</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "3px 10px", fontWeight: 700 }}>Coming soon</span>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>Recent Security Events</SectionTitle>
        <button type="button" onClick={() => { onSignOut(); }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", textDecoration: "none", cursor: "pointer" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Sign out of all devices</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Revokes all active sessions immediately</div>
          </div>
          <span style={{ color: "var(--red)", fontSize: 12, fontWeight: 700 }}>Sign out all →</span>
        </button>
      </SectionCard>
    </div>
  );
}

/* ── Privacy Tab ─────────────────────────────────────────────────────────── */
function PrivacyTab({ userEmail }: { userEmail: string }) {
  const [perms, setPerms] = useState({ profile_visible: true, activity_tracking: false, marketing_emails: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteStep, setDelete] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.privacyOverview()
      .then(r => { if (r.permissions) setPerms(p => ({ ...p, ...r.permissions })); })
      .catch(() => { /* use defaults */ })
      .finally(() => setLoading(false));
  }, []);

  async function handlePermChange(key: keyof typeof perms, val: boolean) {
    const next = { ...perms, [key]: val };
    setPerms(next);
    setSaving(true);
    try { await api.updatePermissions({ [key]: val }); }
    catch { setPerms(perms); }
    finally { setSaving(false); }
  }

  async function handleDeleteRequest() {
    setLoading(true);
    try { await api.requestAccountDeletion(); setDelete(2); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : "Request failed"); }
    finally { setLoading(false); }
  }

  function Row({ label, desc, val, onChange }: { label: string; desc: string; val: boolean; onChange: (v: boolean) => void }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
        </div>
        <button onClick={() => onChange(!val)} disabled={saving}
          style={{
            width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", flexShrink: 0,
            background: val ? "var(--green)" : "var(--border-2)", transition: "background 0.2s", position: "relative",
          }}>
          <span style={{ position: "absolute", top: 2, left: val ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </button>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard>
        <SectionTitle>Your Data</SectionTitle>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", fontSize: 11, color: "var(--muted)", lineHeight: 1.7, marginBottom: 10 }}>
          📍 Data stored in Nigeria region · Retained while account is active · <a href="https://trust.rald.cloud/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>Privacy policy →</a>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "var(--surface)", border: "1px solid var(--border-2)", color: "var(--text)", cursor: "pointer" }}>
            Export my data
          </button>
          <a href="mailto:privacy@rald.cloud" style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "var(--surface)", border: "1px solid var(--border-2)", color: "var(--muted)", textDecoration: "none" }}>
            Privacy questions
          </a>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>Privacy Controls</SectionTitle>
        <Row label="Public profile" desc="Let other RALD users find and see your profile." val={perms.profile_visible} onChange={v => void handlePermChange("profile_visible", v)} />
        <Row label="Activity tracking" desc="Improve recommendations based on your usage." val={perms.activity_tracking} onChange={v => void handlePermChange("activity_tracking", v)} />
        <Row label="Marketing emails" desc="Receive product updates and announcements from RALD." val={perms.marketing_emails} onChange={v => void handlePermChange("marketing_emails", v)} />
        <div style={{ paddingTop: 10, fontSize: 11, color: "var(--muted)" }}>
          Changes take effect immediately.
        </div>
      </SectionCard>

      <SectionCard style={{ border: "1px solid var(--red-border)" }}>
        <SectionTitle>Danger Zone</SectionTitle>
        {err && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 10 }}>{err}</div>}
        {deleteStep === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Delete Account</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Permanently remove your account and all data in 30 days.</div>
            </div>
            <button onClick={() => setDelete(1)} style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "var(--red)", cursor: "pointer" }}>Delete…</button>
          </div>
        )}
        {deleteStep === 1 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>⚠ Are you sure?</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
              Your account <strong style={{ color: "var(--text)" }}>{userEmail}</strong> will be scheduled for deletion in 30 days. All data, sessions, organizations, and verification status will be permanently removed.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setDelete(0)} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 0", fontSize: 12, fontWeight: 700, color: "var(--muted)", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => void handleDeleteRequest()} disabled={loading} style={{ flex: 1, background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 9, padding: "9px 0", fontSize: 12, fontWeight: 700, color: "var(--red)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Requesting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        )}
        {deleteStep === 2 && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Deletion scheduled</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Contact <a href="mailto:privacy@rald.cloud" style={{ color: "var(--green)" }}>privacy@rald.cloud</a> to cancel.</div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ── Organizations Tab ───────────────────────────────────────────────────── */
function OrganizationsTab({ organizations, onRefresh }: { organizations: OrgEntry[]; onRefresh: () => void }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", handle: "", type: "general", description: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try { await api.createOrganization(form); setCreating(false); setForm({ name: "", handle: "", type: "general", description: "" }); onRefresh(); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : "Create failed"); }
    finally { setLoading(false); }
  }

  async function leave(orgId: string) {
    try { await api.leaveOrganization(orgId); onRefresh(); }
    catch { /* best-effort */ }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{organizations.length} organization{organizations.length !== 1 ? "s" : ""}</span>
        <button onClick={() => setCreating(!creating)}
          style={{ background: "var(--green-dim)", border: "1px solid var(--green-border)", borderRadius: 8, padding: "5px 12px", color: "var(--green)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          + New Org
        </button>
      </div>

      {creating && (
        <SectionCard>
          <form onSubmit={e => void create(e)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="rald-input" placeholder="Organization name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={80} />
            <input className="rald-input" placeholder="Handle (no spaces)" value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} required maxLength={30} />
            <select className="rald-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {Object.entries(ORG_TYPE_ICONS).map(([k]) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
            </select>
            <textarea style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", resize: "vertical", minHeight: 60 }}
              placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={300} />
            {err && <div style={{ color: "var(--red)", fontSize: 12 }}>{err}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ maxWidth: 140 }}>{loading ? "Creating…" : "Create"}</button>
              <button type="button" onClick={() => setCreating(false)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </SectionCard>
      )}

      {organizations.length === 0 && !creating && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>No organizations yet</div>
      )}

      {organizations.map(org => (
        <div key={org.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{ORG_TYPE_ICONS[org.type] ?? "🏢"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{org.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>@{org.handle} · {org.type}</div>
            {org.description && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{org.description}</div>}
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>Your role: <span style={{ fontWeight: 700, color: "var(--text)" }}>{org.member_role}</span></div>
          </div>
          {org.member_role !== "owner" && (
            <button onClick={() => void leave(org.id)}
              style={{ flexShrink: 0, background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "4px 10px", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              Leave
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Audit Tab ───────────────────────────────────────────────────────────── */
function AuditTab({ auditLogs }: { auditLogs: AuditLogEntry[] }) {
  if (auditLogs.length === 0) return (
    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>No audit log entries</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Append-only · {auditLogs.length} events</div>
      {auditLogs.map(a => (
        <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>{AUDIT_ACTION_ICONS[a.action] ?? "📋"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{a.action.replace(/_/g, " ")}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
              {a.ip_address ?? "—"} · {new Date(a.created_at).toLocaleString()}
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: a.status === "success" ? "var(--green)" : "var(--red)", flexShrink: 0 }}>
            {a.status}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Settings Tab ────────────────────────────────────────────────────────── */
function SettingsTab({ userEmail, userName }: { userEmail: string; userName: string | null }) {
  const [, navigate] = useLocation();
  const { logout } = useAuth();

  function handleSignOut() { clearToken(); logout(); navigate("/"); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard>
        <SectionTitle>Account</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Email address", value: userEmail },
            { label: "Display name", value: userName ?? "—" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.value}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>Quick Links</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Privacy Policy", url: "https://trust.rald.cloud/privacy", icon: "🔒" },
            { label: "Security Center", url: "https://trust.rald.cloud/security", icon: "🛡" },
            { label: "Verification Policy", url: "https://trust.rald.cloud/verification", icon: "✓" },
            { label: "AI Usage Policy", url: "https://trust.rald.cloud/ai", icon: "◈" },
            { label: "Trust Center", url: "https://trust.rald.cloud", icon: "✦" },
            { label: "Learn Center", url: "https://learn.rald.cloud", icon: "📚" },
            { label: "System Status", url: "https://status.rald.cloud", icon: "📡" },
            { label: "Contact Support", url: "mailto:support@rald.cloud", icon: "✉" },
          ].map(l => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", textDecoration: "none" }}>
              <span style={{ fontSize: 16 }}>{l.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{l.label}</span>
              <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 11 }}>→</span>
            </a>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>RALD Ecosystem</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { name: "Profiles", url: "https://profiles.rald.cloud" },
            { name: "App", url: "https://app.rald.cloud" },
            { name: "Manilla", url: "https://manilla.rald.cloud" },
            { name: "Loop", url: "https://loop.rald.cloud" },
            { name: "Messenger", url: "https://messenger.rald.cloud" },
            { name: "Voice", url: "https://voice.rald.cloud" },
            { name: "Mail", url: "https://mail.rald.cloud" },
            { name: "DunaRald", url: "https://dunarald.rald.cloud" },
          ].map(p => (
            <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer"
              style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "var(--card)", border: "1px solid var(--border-2)", color: "var(--muted)", textDecoration: "none" }}>
              {p.name} →
            </a>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>Session</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sign out</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Sign out of this device</div>
          </div>
          <button onClick={handleSignOut}
            style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "var(--red)", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </SectionCard>

      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.8 }}>
          RALD · LILCKY STUDIO LIMITED · Nigeria<br />
          <a href="mailto:privacy@rald.cloud" style={{ color: "var(--muted)" }}>privacy@rald.cloud</a> · <a href="mailto:support@rald.cloud" style={{ color: "var(--muted)" }}>support@rald.cloud</a>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard (main) ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("profile");

  const [profile,       setProfile]   = useState<ProfileData | null>(null);
  const [connectedApps, setConnected] = useState<ConnectedApp[]>([]);
  const [provisionedIds,setProv]      = useState<string[]>([]);
  const [sessions,      setSessions]  = useState<SessionEntry[]>([]);
  const [devices,       setDevices]   = useState<DeviceEntry[]>([]);
  const [activity,      setActivity]  = useState<ActivityEntry[]>([]);
  const [organizations, setOrgs]      = useState<OrgEntry[]>([]);
  const [auditLogs,     setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [verification,  setVerif]     = useState<VerificationStatus | null>(null);

  const loadProfile     = useCallback(() => api.profile().then(setProfile).catch(() => null), []);
  const loadConnected   = useCallback(() => Promise.all([
    api.connectedApps().then(r => setConnected(r.connected_apps)).catch(() => null),
    api.appLauncher().then(r => setProv(r.apps.filter(a => a.provisioned).map(a => a.id))).catch(() => null),
  ]), []);
  const loadSessions    = useCallback(() => api.sessions().then(setSessions).catch(() => null), []);
  const loadDevices     = useCallback(() => api.devices().then(setDevices).catch(() => null), []);
  const loadActivity    = useCallback(() => api.activity().then(r => setActivity(r.activity)).catch(() => null), []);
  const loadOrgs        = useCallback(() => api.organizations().then(r => setOrgs(r.organizations)).catch(() => null), []);
  const loadAuditLogs   = useCallback(() => api.auditLogs().then(r => setAuditLogs(r.audit_logs)).catch(() => null), []);
  const loadVerif       = useCallback(() => api.verificationStatus().then(setVerif).catch(() => null), []);

  useEffect(() => { void loadProfile(); void loadConnected(); void loadVerif(); }, [loadProfile, loadConnected, loadVerif]);

  useEffect(() => {
    if (tab === "sessions")      void loadSessions();
    if (tab === "devices")       void loadDevices();
    if (tab === "activity")      void loadActivity();
    if (tab === "organizations") void loadOrgs();
    if (tab === "audit")         void loadAuditLogs();
    if (tab === "security")      void loadVerif();
  }, [tab, loadSessions, loadDevices, loadActivity, loadOrgs, loadAuditLogs, loadVerif]);

  function handleLogout() { clearToken(); logout(); navigate("/"); }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "profile",       label: "Profile",    icon: "👤" },
    { id: "connected",     label: "Apps",       icon: "🔗" },
    { id: "verification",  label: "Verify",     icon: "✓"  },
    { id: "sessions",      label: "Sessions",   icon: "🔑" },
    { id: "devices",       label: "Devices",    icon: "📱" },
    { id: "activity",      label: "Activity",   icon: "📋" },
    { id: "security",      label: "Security",   icon: "🛡️" },
    { id: "organizations", label: "Orgs",       icon: "🏢" },
    { id: "audit",         label: "Audit",      icon: "🔍" },
    { id: "privacy",       label: "Privacy",    icon: "🔒" },
    { id: "settings",      label: "Settings",   icon: "⚙️" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
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

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* User hero */}
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
              <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, letterSpacing: "0.04em", marginTop: 3, fontFamily: "monospace" }}>{profile.rald_id}</div>
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

        {/* Tabs */}
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
                transition: "all 0.15s", minWidth: 56,
              }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "profile"       && <ProfileTab       profile={profile} verification={verification} onUpdated={loadProfile} />}
        {tab === "connected"     && <ConnectedAppsTab apps={connectedApps} provisionedIds={provisionedIds} onRefresh={() => { void loadConnected(); }} />}
        {tab === "verification"  && <VerificationTab  verification={verification} />}
        {tab === "sessions"      && <SessionsTab      sessions={sessions} onRevokeAll={handleLogout} />}
        {tab === "devices"       && <DevicesTab       devices={devices} />}
        {tab === "activity"      && <ActivityTab      activity={activity} />}
        {tab === "security"      && <SecurityTab      verification={verification} userEmail={user?.email ?? ""} onSignOut={handleLogout} />}
        {tab === "organizations" && <OrganizationsTab organizations={organizations} onRefresh={loadOrgs} />}
        {tab === "audit"         && <AuditTab         auditLogs={auditLogs} />}
        {tab === "privacy"       && <PrivacyTab       userEmail={user?.email ?? ""} />}
        {tab === "settings"      && <SettingsTab      userEmail={user?.email ?? ""} userName={profile?.name ?? user?.name ?? null} />}
      </div>
    </div>
  );
}
