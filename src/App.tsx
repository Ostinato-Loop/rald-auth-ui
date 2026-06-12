/**
 * rald-auth-ui — DEPRECATED
 *
 * This app has been consolidated into profiles.rald.cloud (rald-identity repo)
 * as part of the RALD Identity UI Consolidation.
 *
 * There is now exactly ONE user-facing identity experience in RALD:
 *   profiles.rald.cloud — The Official RALD Account Portal
 *
 * All routes redirect to profiles.rald.cloud, preserving any query parameters
 * so that existing integrations (redirect_to, app_id, etc.) continue to work.
 *
 * DO NOT ADD NEW FEATURES OR FLOWS HERE.
 * Direct all identity work to the rald-identity repository.
 *
 * RALD Identity UI Consolidation
 * LILCKY STUDIO LIMITED
 */

import { useEffect } from "react";

const CANONICAL = "https://profiles.rald.cloud";

/**
 * Preserve query params and hash when redirecting so that:
 *   rald-auth-ui.com/login?redirect_to=https://loop.rald.cloud&app_id=loop
 * becomes:
 *   profiles.rald.cloud/login?redirect_to=https://loop.rald.cloud&app_id=loop
 *
 * Path-to-path mapping for known routes.
 */
function buildRedirectTarget(): string {
  const path    = window.location.pathname;
  const search  = window.location.search;
  const hash    = window.location.hash;

  // Map known rald-auth-ui paths to profiles.rald.cloud equivalents
  const pathMap: Record<string, string> = {
    "/":          "/login",
    "/login":     "/login",
    "/verify":    "/verify",
    "/signup":    "/",          // profiles.rald.cloud uses username-first registration at /
    "/register":  "/",
    "/reset":     "/login",     // profiles.rald.cloud handles recovery via OTP
    "/forgot":    "/login",
    "/password":  "/login",
    "/dashboard": "/account",
    "/profile":   "/account",
    "/apps":      "/account",
    "/suspended": "/login",
  };

  const targetPath = pathMap[path] ?? "/login";
  return `${CANONICAL}${targetPath}${search}${hash}`;
}

function DeprecatedNotice() {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "oklch(0.15 0.02 150)",
      color: "oklch(0.90 0.03 150)",
      padding: "10px 20px",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 12, fontSize: 12, fontWeight: 600,
      zIndex: 9999,
    }}>
      <span style={{ color: "oklch(0.72 0.14 80)" }}>⚠</span>
      This interface has moved to{" "}
      <a href={CANONICAL} style={{ color: "oklch(0.72 0.15 150)", fontWeight: 800 }}>
        profiles.rald.cloud
      </a>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const target = buildRedirectTarget();
    // Hard redirect immediately — no delay, no flash
    window.location.replace(target);
  }, []);

  // Minimal loading state while redirect fires
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "100dvh",
      background: "oklch(0.12 0.01 150)",
      fontFamily: "-apple-system, system-ui, sans-serif",
      gap: 20,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {/* RALD wordmark */}
        <div style={{
          fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em",
          color: "oklch(0.92 0.04 150)",
        }}>
          RALD
        </div>

        {/* Spinner */}
        <div style={{
          width: 22, height: 22,
          border: "2.5px solid oklch(0.30 0.02 150)",
          borderTopColor: "oklch(0.52 0.15 150)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />

        <p style={{ fontSize: 13, color: "oklch(0.55 0.02 150)", fontWeight: 500 }}>
          Taking you to profiles.rald.cloud…
        </p>
      </div>

      <a
        href={buildRedirectTarget()}
        style={{
          fontSize: 12, color: "oklch(0.52 0.15 150)", fontWeight: 700,
          marginTop: 8,
        }}
      >
        Click here if you are not redirected
      </a>

      <DeprecatedNotice />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
