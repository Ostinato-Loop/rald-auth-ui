import { clearToken } from "../lib/api";

export default function SuspendedPage() {
  function handleSignOut() {
    clearToken();
    window.location.href = "/";
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ maxWidth: 400, width: "100%", background: "var(--card)", border: "1px solid var(--red-border)", borderRadius: 20, padding: "36px 28px", textAlign: "center", boxShadow: "0 0 60px rgba(230,57,47,.12)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--red)", marginBottom: 8 }}>Account Suspended</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
          Your RALD account has been suspended. You cannot access RALD ecosystem apps until this is resolved.
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
          Contact{" "}
          <a href="mailto:support@rald.cloud" style={{ color: "var(--text)", fontWeight: 600 }}>support@rald.cloud</a>
          {" "}if you believe this is a mistake.
        </p>
        <button onClick={handleSignOut}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 22px", color: "var(--text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
