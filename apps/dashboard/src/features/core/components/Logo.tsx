// Reusable Logo component

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 44, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-primary)" />
          <stop offset="100%" stopColor="var(--accent-secondary)" />
        </linearGradient>
        <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Hexagon Target Frame */}
      <polygon
        points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5"
        stroke="url(#logoGrad)"
        strokeWidth="5"
        strokeLinejoin="round"
        style={{ filter: 'url(#logoGlow)', opacity: 0.95 }}
      />

      {/* Inner Target Ring */}
      <circle
        cx="50"
        cy="50"
        r="28"
        stroke="var(--accent-secondary)"
        strokeWidth="3"
        strokeDasharray="6 8"
        opacity="0.7"
      />

      {/* Central Agent Node */}
      <circle cx="50" cy="50" r="10" fill="url(#logoGrad)" style={{ filter: 'url(#logoGlow)' }} />

      {/* Crosshairs pointing inward */}
      <line
        x1="50"
        y1="12"
        x2="50"
        y2="22"
        stroke="url(#logoGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="88"
        x2="50"
        y2="78"
        stroke="url(#logoGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="50"
        x2="22"
        y2="50"
        stroke="url(#logoGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="88"
        y1="50"
        x2="78"
        y2="50"
        stroke="url(#logoGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
