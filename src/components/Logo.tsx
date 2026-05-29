export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <div style={{
        filter: "drop-shadow(0 0 10px rgba(245, 158, 11, 0.45))",
        transition: "filter 0.2s ease",
      }}>
        <img
          src="/rald-logo.png"
          alt="RALD"
          style={{
            width: size,
            height: size,
            objectFit: "contain",
          }}
        />
      </div>
      <div>
        <div style={{
          fontSize: size * 0.54,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: "var(--text-primary)",
          lineHeight: 1,
        }}>
          RALD
        </div>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--amber)",
          marginTop: 2,
        }}>
          Identity
        </div>
      </div>
    </div>
  );
}
