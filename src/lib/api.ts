// RALD Auth UI — API Client
// Talks to rald-auth-core at auth.rald.cloud

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
  createdAt: string;
};

export type AuthResponse = { token: string; user: AuthUser };

export const api = {
  login: (email: string, password: string) =>
    req<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    phone?: string;
  }) =>
    req<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendOtp: (phone: string) =>
    req<{ pinId: string; message: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (pinId: string, pin: string, phone: string) =>
    req<AuthResponse | { newUser: true; phone: string; otpToken: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ pinId, pin, phone }),
    }),

  sendLoginEmailOtp: (email: string) =>
    req<{ sessionToken: string; message: string }>("/auth/send-login-email-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyLoginEmailOtp: (sessionToken: string, code: string) =>
    req<AuthResponse | { newUser: true; email: string; emailToken: string }>(
      "/auth/verify-login-email-otp",
      { method: "POST", body: JSON.stringify({ sessionToken, code }) }
    ),

  me: () => req<AuthUser>("/auth/me"),

  requestPasswordReset: (email: string) =>
    req<{ message: string }>("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    req<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    }),

  sessions: () => req<unknown[]>("/auth/sessions"),
  revokeSession: (id: string) => req(`/auth/sessions/${id}`, { method: "DELETE" }),
  revokeAllSessions: () => req("/auth/sessions", { method: "DELETE" }),

  devices: () => req<unknown[]>("/devices"),
  trustDevice: (id: string) => req(`/devices/${id}/trust`, { method: "POST" }),
  removeDevice: (id: string) => req(`/devices/${id}`, { method: "DELETE" }),
};

export function saveToken(token: string) {
  localStorage.setItem("rald_token", token);
}

export function clearToken() {
  localStorage.removeItem("rald_token");
}

export function getToken(): string | null {
  return localStorage.getItem("rald_token");
}
