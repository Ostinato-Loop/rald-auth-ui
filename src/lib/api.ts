// RALD Identity — API Client
// Phase H: Foundation Hardening — Organizations, Audit Logs, Verification, Security
// LILCKY STUDIO LIMITED

const BASE = import.meta.env.VITE_AUTH_API_URL ?? "https://auth.rald.cloud";

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("rald_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const json = await res.json();
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  return json as T;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone?: string | null;
  raldId?: string | null;
  createdAt: string;
};

export type AuthResponse        = { token: string; user: AuthUser };
export type OtpSentResponse     = { sessionToken?: string; pinId?: string; message: string };
export type OtpVerifyResponse   =
  | AuthResponse
  | { newUser: true; phone?: string; email?: string; otpToken?: string; emailToken?: string };

export type ProfileData = {
  id: string;
  rald_id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  preferences: Record<string, unknown>;
  provisioned_apps: string[];
  active_products: string[];
  created_at: string;
  identity_hub: string;
};

export type EcosystemApp = {
  id: string;
  name: string;
  url: string;
  icon: string;
  provisioned: boolean;
  role: string | null;
};

export type ConnectedApp = {
  app_id: string;
  role: string;
  connected: string;
  meta: { id: string; name: string; url: string; icon: string } | null;
};

export type ActivityEntry = {
  id: string;
  app_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  success: boolean;
  created_at: string;
};

export type SessionEntry = {
  id: string;
  user_agent?: string;
  ip_address?: string;
  last_seen_at?: string;
  created_at: string;
  expires_at?: string;
};

export type DeviceEntry = {
  id: string;
  device_name?: string;
  device_type?: string;
  is_trusted?: boolean;
  trusted?: boolean;
  last_seen_at: string;
};

export type OrgEntry = {
  id: string;
  name: string;
  handle: string;
  type: string;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  created_by: string;
  member_role: string;
  joined_at: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type VerificationStatus = {
  email: string | null;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
};

// ── Token helpers ─────────────────────────────────────────────────────────
export const saveToken  = (t: string) => localStorage.setItem("rald_token", t);
export const clearToken = ()          => localStorage.removeItem("rald_token");
export const getToken   = ()          => localStorage.getItem("rald_token");

// ── Redirect helpers ──────────────────────────────────────────────────────
export const saveRedirect  = (url: string, appId: string) => {
  sessionStorage.setItem("rald_redirect_to", url);
  sessionStorage.setItem("rald_app_id", appId);
};
export const getRedirectTo = () => sessionStorage.getItem("rald_redirect_to");
export const getAppId      = () => sessionStorage.getItem("rald_app_id") ?? "rald-app";
export const clearRedirect = () => {
  sessionStorage.removeItem("rald_redirect_to");
  sessionStorage.removeItem("rald_app_id");
};

// ── Identity helpers ──────────────────────────────────────────────────────
export function detectIdentityType(value: string): "email" | "phone" {
  return value.trim().includes("@") ? "email" : "phone";
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return "234" + digits.slice(1);
  return digits;
}

export function generateRaldId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "RALD-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ── API ───────────────────────────────────────────────────────────────────
export const api = {
  // Auth
  me: () => req<AuthUser>("/auth/me"),

  login: (email: string, password: string) =>
    req<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    }),

  register: (data: {
    name: string; email: string; phone?: string; password: string;
    raldId?: string; role?: string;
  }) => req<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  sendOtp: (identity: string): Promise<OtpSentResponse> => {
    if (detectIdentityType(identity) === "email") {
      return req<OtpSentResponse>("/auth/send-login-email-otp", {
        method: "POST", body: JSON.stringify({ email: identity.trim().toLowerCase() }),
      });
    }
    return req<OtpSentResponse>("/auth/send-otp", {
      method: "POST", body: JSON.stringify({ phone: normalizePhone(identity) }),
    });
  },

  verifyOtp: (identity: string, code: string, session: { pinId?: string; sessionToken?: string }): Promise<OtpVerifyResponse> => {
    if (detectIdentityType(identity) === "email") {
      return req<OtpVerifyResponse>("/auth/verify-login-email-otp", {
        method: "POST", body: JSON.stringify({ sessionToken: session.sessionToken, code }),
      });
    }
    return req<OtpVerifyResponse>("/auth/verify-otp", {
      method: "POST", body: JSON.stringify({ pinId: session.pinId, pin: code, phone: normalizePhone(identity) }),
    });
  },

  requestReset: (email: string) =>
    req<{ message: string }>("/auth/request-password-reset", {
      method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    req<{ message: string }>("/auth/reset-password", {
      method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase(), code, newPassword }),
    }),

  ssoExchange: (appId: string) =>
    req<{ token: string; appId: string; expiresIn: number }>("/sso/exchange", {
      method: "POST", body: JSON.stringify({ appId }),
    }),

  clerkExchange: (appId: string) =>
    req<{ clerkTicket: string; redirectUrl: string; appId: string }>("/sso/clerk-exchange", {
      method: "POST", body: JSON.stringify({ appId }),
    }),

  // Sessions
  sessions:          ()           => req<SessionEntry[]>("/auth/sessions"),
  revokeSession:     (id: string) => req<{ message: string }>(`/auth/sessions/${id}`, { method: "DELETE" }),
  revokeAllSessions: ()           => req<{ message: string }>("/session/revoke-all",  { method: "POST" }),

  // Devices
  devices:      ()           => req<DeviceEntry[]>("/devices"),
  removeDevice: (id: string) => req<{ message: string }>(`/session/device/${id}`, { method: "DELETE" }),
  trustDevice:  (id: string) => req<{ message: string }>(`/devices/${id}/trust`,  { method: "POST"   }),

  // Profile
  profile:       ()             => req<ProfileData>("/profiles/me"),
  updateProfile: (data: { display_name?: string; bio?: string; avatar_url?: string }) =>
    req<{ ok: boolean }>("/profiles/me", { method: "PATCH", body: JSON.stringify(data) }),

  // App Launcher
  appLauncher:   ()              => req<{ apps: EcosystemApp[]; provisioned_count: number }>("/profiles/apps"),
  connectedApps: ()              => req<{ connected_apps: ConnectedApp[]; count: number }>("/profiles/connected-apps"),
  provisionApp:  (appId: string) =>
    req<{ ok: boolean; app_url: string | null }>("/provision/app", {
      method: "POST", body: JSON.stringify({ app_id: appId }),
    }),

  // Activity
  activity: (limit = 50) => req<{ activity: ActivityEntry[] }>(`/profiles/activity?limit=${limit}`),

  // Organizations (Phase H)
  organizations:      ()         => req<{ organizations: OrgEntry[]; count: number }>("/profiles/organizations"),
  createOrganization: (data: { name: string; handle: string; type?: string; description?: string }) =>
    req<{ ok: boolean; organization: OrgEntry }>("/profiles/organizations", {
      method: "POST", body: JSON.stringify(data),
    }),
  leaveOrganization:  (orgId: string) =>
    req<{ ok: boolean }>(`/profiles/organizations/${orgId}`, { method: "DELETE" }),

  // Audit Logs (Phase H)
  auditLogs: (limit = 50) => req<{ audit_logs: AuditLogEntry[]; count: number }>(`/profiles/audit-logs?limit=${limit}`),

  // Verification Status (Phase H)

  // ── Phase 3 — Privacy Center ──────────────────────────────────────────────
  privacyOverview: () =>
    req<{
      data_collected: Record<string, unknown>;
      connected_apps: string[];
      active_sessions: number;
      permissions: { profile_visible: boolean; activity_tracking: boolean; marketing_emails: boolean };
    }>("/privacy/me"),

  updatePermissions: (perms: { profile_visible?: boolean; activity_tracking?: boolean; marketing_emails?: boolean }) =>
    req<{ ok: boolean; permissions: typeof perms }>("/privacy/permissions", {
      method: "PATCH", body: JSON.stringify(perms),
    }),

  requestAccountDeletion: (reason?: string) =>
    req<{ ok: boolean; message: string; scheduled_at: string }>("/privacy/delete-request", {
      method: "POST", body: JSON.stringify({ confirm: true, reason }),
    }),

  cancelAccountDeletion: () =>
    req<{ ok: boolean; message: string }>("/privacy/cancel-deletion", { method: "POST" }),

  // ── Phase 5 — Role Engine ─────────────────────────────────────────────────
  allRoles: () =>
    req<{ roles: Array<{ role: string; label: string; description: string; capabilities: string[]; requires_verification: boolean }>; total: number }>("/roles/all"),

  myRole: () =>
    req<{
      primary_role: string;
      role_info: { label: string; description: string; capabilities: string[] };
      product_roles: Array<{ product: string; role: string; granted_at: string }>;
      additional_roles: string[];
      verified_as: string[];
    }>("/roles/me"),

  requestRole: (requested_role: string, reason?: string) =>
    req<{ ok: boolean; granted: boolean; role: string; message: string }>("/roles/request", {
      method: "POST", body: JSON.stringify({ requested_role, reason }),
    }),

  roleCapabilities: (role: string) =>
    req<{ role: string; label: string; description: string; capabilities: string[] }>(`/roles/capabilities/${role}`),

  // ── Phase 6 — Verification Engine ────────────────────────────────────────
  verifications: () =>
    req<{
      verifications: Array<{
        id: string; verification_type: string; status: string; name: string;
        description?: string; submitted_at: string; reviewed_at?: string;
      }>;
      count: number;
      has_approved: boolean;
      approved_types: string[];
    }>("/verify/status"),

  applyVerification: (data: {
    type: "artist" | "label" | "radio" | "advertiser" | "media_house" | "community";
    name: string;
    description?: string;
    website?: string;
    social_links?: Record<string, string>;
    documents?: string[];
  }) =>
    req<{ ok: boolean; application: Record<string, unknown>; message: string }>("/verify/apply", {
      method: "POST", body: JSON.stringify(data),
    }),

  withdrawVerification: (id: string) =>
    req<{ ok: boolean; message: string }>(`/verify/${id}`, { method: "DELETE" }),

  verificationBadge: (type: string) =>
    req<{ verified: boolean; type: string; badge: string; issued_at: string }>(`/verify/badge/${type}`, {
      method: "POST",
    }),

  // Legacy (Phase H) — keep for backward compat
  verificationStatus: () => req<VerificationStatus>("/profiles/verification"),
};
