interface KlsGridLogoProps {
  /** Show just the icon badge or the full KLS + badge */
  variant?: "full" | "badge";
  className?: string;
  /** Height in pixels (width scales proportionally) */
  height?: number;
}

/**
 * KLS GRID logo — matches the orange brand mark from the uploaded image.
 * "KLS" is in orange text; "GRID" sits inside an orange rectangle with white text
 * and the custom G/C-ring letterform.
 */
const KlsGridLogo = ({ variant = "full", className = "", height = 40 }: KlsGridLogoProps) => {
  const ORANGE = "#F26522";

  if (variant === "badge") {
    // Just the orange GRID badge
    return (
      <svg
        viewBox="0 0 120 40"
        height={height}
        width={height * 3}
        className={className}
        aria-label="KLS Grid"
        role="img"
      >
        <rect width="120" height="40" rx="3" fill={ORANGE} />
        {/* Grid dot pattern overlay */}
        {[12, 24, 36, 48, 60, 72, 84, 96, 108].map((x) =>
          [8, 20, 32].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={0.8} fill="white" opacity={0.25} />
          ))
        )}
        {/* G/C ring mark */}
        <g transform="translate(16, 20)">
          <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="3" fill="white" />
          {/* open gap on right to make it look like a C */}
          <rect x="5" y="-3" width="6" height="6" fill={ORANGE} />
        </g>
        {/* RID */}
        <text
          x="30"
          y="27"
          fontFamily="'Space Grotesk', Arial, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill="white"
          letterSpacing="1"
        >
          RID
        </text>
      </svg>
    );
  }

  // Full logo: KLS (orange) + GRID badge
  const totalHeight = height;
  const badgeW = totalHeight * 3;
  const klsW = totalHeight * 2.1;
  const totalW = klsW + badgeW + totalHeight * 0.35;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalHeight}`}
      height={totalHeight}
      width={totalW}
      className={className}
      aria-label="KLS Grid"
      role="img"
    >
      {/* KLS text */}
      <text
        x="0"
        y={totalHeight * 0.78}
        fontFamily="'Space Grotesk', Arial, sans-serif"
        fontWeight="700"
        fontSize={totalHeight * 0.82}
        fill={ORANGE}
        letterSpacing="2"
      >
        KLS
      </text>

      {/* Gap */}
      <g transform={`translate(${klsW + totalHeight * 0.18}, 0)`}>
        {/* Orange rectangle */}
        <rect width={badgeW} height={totalHeight} rx="3" fill={ORANGE} />
        {/* Grid dot pattern overlay */}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((x) =>
          [8, 20, 32].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={0.7} fill="white" opacity={0.25} />
          ))
        )}
        {/* C-ring letterform (custom G) */}
        <g transform={`translate(${totalHeight * 0.44}, ${totalHeight / 2})`}>
          <circle cx="0" cy="0" r={totalHeight * 0.31} fill="none" stroke="white" strokeWidth={totalHeight * 0.09} />
          <circle cx="0" cy="0" r={totalHeight * 0.12} fill="white" />
          {/* right gap to make it a C */}
          <rect
            x={totalHeight * 0.18}
            y={-totalHeight * 0.15}
            width={totalHeight * 0.35}
            height={totalHeight * 0.3}
            fill={ORANGE}
          />
        </g>
        {/* RID letters */}
        <text
          x={totalHeight * 0.98}
          y={totalHeight * 0.76}
          fontFamily="'Space Grotesk', Arial, sans-serif"
          fontWeight="700"
          fontSize={totalHeight * 0.72}
          fill="white"
          letterSpacing="1.5"
        >
          RID
        </text>
      </g>
    </svg>
  );
};

export default KlsGridLogo;
