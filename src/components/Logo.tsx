interface LogoProps {
  size?: number;
}

export default function Logo({ size = 48 }: LogoProps) {
  return (
    <img
      src="/rald-logo.png"
      alt="RALD"
      width={size}
      height={size}
      style={{
        objectFit: "contain",
        filter: "drop-shadow(0 0 10px rgba(0,86,160,0.35))",
        display: "block",
      }}
    />
  );
}
