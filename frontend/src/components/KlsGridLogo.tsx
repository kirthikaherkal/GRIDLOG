interface KlsGridLogoProps {
  variant?: "full" | "badge";
  className?: string;
  height?: number; // height in pixels
}

const KlsGridLogo = ({
  variant = "full",
  className = "",
  height = 40,
}: KlsGridLogoProps) => {
  // Full logo image
  if (variant === "full") {
    return (
      <img
        src="/kls-grid-logo.png"
        alt="KLS Grid"
        height={height}
        style={{
          height: `${height}px`,
          width: "auto",
          objectFit: "contain",
        }}
        className={className}
      />
    );
  }

  // Badge version (crop only GRID badge separately if needed)
  return (
    <img
      src="/kls-grid-logo.png"
      alt="KLS Grid"
      height={height}
      style={{
        height: `${height}px`,
        width: "auto",
        objectFit: "contain",
      }}
      className={className}
    />
  );
};

export default KlsGridLogo;