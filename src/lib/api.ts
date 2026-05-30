// RALD Identity — API Client
// All calls go to rald-auth-core at auth.rald.cloud

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
  me: () => req<AuthUser>("/auth/me"),

  login: (email: string, password: string) =>
    req<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    }),

  register: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    raldId?: string;
    role?: string;
  }) =>
    req<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendOtp: (identity: string): Promise<OtpSentResponse> => {
    if (detectIdentityType(identity) === "email") {
      return req<OtpSentResponse>("/auth/send-login-email-otp", {
        method: "POST",
        body: JSON.stringify({ email: identity.trim().toLowerCase() }),
      });
    }
    return req<OtpSentResponse>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone: normalizePhone(identity) }),
    });
  },

  verifyOtp: (
    identity: string,
    code: string,
    session: { pinId?: string; sessionToken?: string }
  ): Promise<OtpVerifyResponse> => {
    if (detectIdentityType(identity) === "email") {
      return req<OtpVerifyResponse>("/auth/verify-login-email-otp", {
        method: "POST",
        body: JSON.stringify({ sessionToken: session.sessionToken, code }),
      });
    }
    return req<OtpVerifyResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        pinId: session.pinId,
        pin: code,
        phone: normalizePhone(identity),
      }),
    });
  },

  requestReset: (email: string) =>
    req<{ message: string }>("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    req<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), code, newPassword }),
    }),

  clerkExchange: (appId: string) =>
    req<{ clerkTicket: string; redirectUrl: string; appId: string }>(
      "/sso/clerk-exchange",
      { method: "POST", body: JSON.stringify({ appId }) }
    ),

  ssoExchange: (appId: string) =>
    req<{ token: string; appId: string; expiresIn: number }>("/sso/exchange", {
      method: "POST",
      body: JSON.stringify({ appId }),
    }),

  sessions:          ()          => req<unknown[]>("/auth/sessions"),
  revokeSession:     (id: string) => req<{ message: string }>(`/auth/sessions/${id}`,    { method: "DELETE" }),
  revokeAllSessions: ()          => req<{ message: string }>("/auth/sessions",           { method: "DELETE" }),

  devices:      ()          => req<unknown[]>("/devices"),
  removeDevice: (id: string) => req<{ message: string }>(`/devices/${id}`,              { method: "DELETE" }),
  trustDevice:  (id: string) => req<{ message: string }>(`/devices/${id}/trust`,        { method: "POST" }),
};
