// RALD Identity — API Client
// Phase G.10: Added profile, apps launcher, connectedApps, revokeAll, activity
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

  // Profile (Phase G.10)
  profile:       ()             => req<ProfileData>("/profiles/me"),
  updateProfile: (data: { display_name?: string; bio?: string; avatar_url?: string }) =>
    req<{ ok: boolean }>("/profiles/me", { method: "PATCH", body: JSON.stringify(data) }),

  // App Launcher
  appLauncher:   ()             => req<{ apps: EcosystemApp[]; provisioned_count: number }>("/profiles/apps"),
  connectedApps: ()             => req<{ connected_apps: ConnectedApp[]; count: number }>("/profiles/connected-apps"),
  provisionApp:  (appId: string) =>
    req<{ ok: boolean; app_url: string | null }>("/provision/app", {
      method: "POST", body: JSON.stringify({ app_id: appId }),
    }),

  // Activity
  activity: (limit = 50) => req<{ activity: ActivityEntry[] }>(`/profiles/activity?limit=${limit}`),
};
