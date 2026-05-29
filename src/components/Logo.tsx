export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <img
        src="/rald-logo.jpg"
        alt="RALD"
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          objectFit: "contain",
          background: "#fff",
        }}
      />
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
          color: "var(--green)",
          marginTop: 2,
        }}>
          Identity
        </div>
      </div>
    </div>
  );
}
