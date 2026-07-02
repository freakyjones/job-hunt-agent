'use client';

import styles from './AgentVisual.module.css';

export function AgentVisual() {
  return (
    <div className={styles.visualContainer}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 500 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgCanvas}
      >
        <defs>
          <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>

          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.15" />
            <stop offset="70%" stopColor="var(--accent-secondary)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tech Grid Background */}
        <g className={styles.gridGroup} opacity="0.15">
          <line x1="0" y1="40" x2="500" y2="40" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="500" y2="80" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="0" y1="120" x2="500" y2="120" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="0" y1="160" x2="500" y2="160" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="0" y1="200" x2="500" y2="200" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="0" y1="240" x2="500" y2="240" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="0" y1="280" x2="500" y2="280" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="0" y1="320" x2="500" y2="320" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="0" y1="360" x2="500" y2="360" stroke="var(--border-subtle)" strokeWidth="0.5" />

          <line x1="50" y1="0" x2="50" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="100" y1="0" x2="100" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="150" y1="0" x2="150" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="200" y1="0" x2="200" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="250" y1="0" x2="250" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="300" y1="0" x2="300" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="350" y1="0" x2="350" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="400" y1="0" x2="400" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
          <line x1="450" y1="0" x2="450" y2="400" stroke="var(--border-subtle)" strokeWidth="0.5" />
        </g>

        {/* Outer Boundary Bracket Marks */}
        <path
          d="M 20 40 L 20 20 L 40 20"
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 480 40 L 480 20 L 460 20"
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 20 360 L 20 380 L 40 380"
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 480 360 L 480 380 L 460 380"
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Constellation Network Lines (Data Pipes) */}
        <g opacity="0.6">
          <line x1="250" y1="200" x2="150" y2="120" stroke="url(#primaryGrad)" strokeWidth="1" />
          <line x1="250" y1="200" x2="350" y2="140" stroke="url(#primaryGrad)" strokeWidth="1" />
          <line x1="250" y1="200" x2="250" y2="310" stroke="url(#primaryGrad)" strokeWidth="1" />
          <line x1="250" y1="200" x2="110" y2="240" stroke="url(#primaryGrad)" strokeWidth="1" />
          <line x1="250" y1="200" x2="390" y2="250" stroke="url(#primaryGrad)" strokeWidth="1" />

          <line
            x1="150"
            y1="120"
            x2="350"
            y2="140"
            stroke="var(--accent-secondary)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <line
            x1="110"
            y1="240"
            x2="150"
            y2="120"
            stroke="var(--accent-secondary)"
            strokeWidth="0.5"
          />
          <line
            x1="390"
            y1="250"
            x2="350"
            y2="140"
            stroke="var(--accent-secondary)"
            strokeWidth="0.5"
          />
          <line
            x1="110"
            y1="240"
            x2="250"
            y2="310"
            stroke="var(--accent-primary)"
            strokeWidth="0.5"
          />
          <line
            x1="390"
            y1="250"
            x2="250"
            y2="310"
            stroke="var(--accent-primary)"
            strokeWidth="0.5"
          />
        </g>

        {/* Animated Data Packets (flowing along paths) */}
        <g>
          <line
            x1="250"
            y1="200"
            x2="150"
            y2="120"
            stroke="var(--accent-secondary)"
            strokeWidth="2.5"
            strokeDasharray="8 60"
            className={styles.packetFlow1}
          />
          <line
            x1="250"
            y1="200"
            x2="350"
            y2="140"
            stroke="var(--accent-primary)"
            strokeWidth="2.5"
            strokeDasharray="8 70"
            className={styles.packetFlow2}
          />
          <line
            x1="250"
            y1="200"
            x2="250"
            y2="310"
            stroke="var(--accent-secondary)"
            strokeWidth="2.5"
            strokeDasharray="8 50"
            className={styles.packetFlow3}
          />
          <line
            x1="250"
            y1="200"
            x2="110"
            y2="240"
            stroke="var(--accent-primary)"
            strokeWidth="2.5"
            strokeDasharray="8 45"
            className={styles.packetFlow4}
          />
          <line
            x1="250"
            y1="200"
            x2="390"
            y2="250"
            stroke="var(--accent-secondary)"
            strokeWidth="2.5"
            strokeDasharray="8 80"
            className={styles.packetFlow5}
          />
        </g>

        {/* Radial Scanning Radar Sweep */}
        <g transform="translate(250, 200)">
          <g className={styles.radarSweep}>
            <path d="M 0 0 L 0 -130 A 130 130 0 0 1 70 -110 Z" fill="url(#radarGrad)" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-130"
              stroke="var(--accent-secondary)"
              strokeWidth="1.5"
              style={{ filter: 'url(#glow)' }}
            />
          </g>
        </g>

        {/* HUD Ring System (around Central Core) */}
        <g transform="translate(250, 200)">
          {/* Inner dotted tracking ring */}
          <g className={styles.rotateCCW}>
            <circle
              cx="0"
              cy="0"
              r="40"
              stroke="var(--accent-secondary)"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.6"
            />
          </g>

          {/* Middle segmented ring */}
          <g className={styles.rotateCW}>
            <circle
              cx="0"
              cy="0"
              r="70"
              stroke="url(#primaryGrad)"
              strokeWidth="2"
              strokeDasharray="30 40 10 20"
              style={{ filter: 'url(#glow)', opacity: 0.8 }}
            />
          </g>

          {/* Outer compass ring */}
          <g className={styles.rotateCCW}>
            <circle
              cx="0"
              cy="0"
              r="110"
              stroke="var(--border-subtle)"
              strokeWidth="1"
              strokeDasharray="4 200 4 200 4 20"
              opacity="0.5"
            />
          </g>
          <g className={styles.rotateCW}>
            <circle
              cx="0"
              cy="0"
              r="130"
              stroke="var(--accent-secondary)"
              strokeWidth="1.5"
              strokeDasharray="150 150"
              opacity="0.3"
            />
          </g>
        </g>

        {/* Constellation Nodes */}
        {/* Central Agent Core */}
        <g transform="translate(250, 200)">
          <circle cx="0" cy="0" r="14" fill="url(#primaryGrad)" style={{ filter: 'url(#glow)' }} />
          <circle cx="0" cy="0" r="6" fill="#fff" />
          <circle
            cx="0"
            cy="0"
            r="22"
            stroke="var(--accent-primary)"
            strokeWidth="1.5"
            className={styles.pulseRing}
          />
        </g>

        {/* Node 1 (Top Left) */}
        <g transform="translate(150, 120)">
          <circle
            cx="0"
            cy="0"
            r="6"
            fill="var(--accent-secondary)"
            style={{ filter: 'url(#glow)' }}
          />
          <circle
            cx="0"
            cy="0"
            r="12"
            stroke="var(--accent-secondary)"
            strokeWidth="1"
            className={styles.pulseRing}
            style={{ animationDelay: '0.4s' }}
          />
        </g>

        {/* Node 2 (Top Right) */}
        <g transform="translate(350, 140)">
          <circle
            cx="0"
            cy="0"
            r="6"
            fill="var(--accent-primary)"
            style={{ filter: 'url(#glow)' }}
          />
          <circle
            cx="0"
            cy="0"
            r="12"
            stroke="var(--accent-primary)"
            strokeWidth="1"
            className={styles.pulseRing}
            style={{ animationDelay: '0.8s' }}
          />
        </g>

        {/* Node 3 (Bottom) */}
        <g transform="translate(250, 310)">
          <circle
            cx="0"
            cy="0"
            r="8"
            fill="var(--accent-secondary)"
            style={{ filter: 'url(#glow)' }}
          />
          <circle
            cx="0"
            cy="0"
            r="16"
            stroke="var(--accent-secondary)"
            strokeWidth="1"
            className={styles.pulseRing}
            style={{ animationDelay: '1.2s' }}
          />
        </g>

        {/* Node 4 (Left) */}
        <g transform="translate(110, 240)">
          <circle
            cx="0"
            cy="0"
            r="5"
            fill="var(--accent-primary)"
            style={{ filter: 'url(#glow)' }}
          />
          <circle
            cx="0"
            cy="0"
            r="10"
            stroke="var(--accent-primary)"
            strokeWidth="1"
            className={styles.pulseRing}
            style={{ animationDelay: '0.2s' }}
          />
        </g>

        {/* Node 5 (Right) */}
        <g transform="translate(390, 250)">
          <circle
            cx="0"
            cy="0"
            r="7"
            fill="var(--accent-secondary)"
            style={{ filter: 'url(#glow)' }}
          />
          <circle
            cx="0"
            cy="0"
            r="14"
            stroke="var(--accent-secondary)"
            strokeWidth="1"
            className={styles.pulseRing}
            style={{ animationDelay: '1.6s' }}
          />
        </g>

        {/* Live Agent Scanning Indicators */}
        <g transform="translate(40, 330)">
          <rect
            x="0"
            y="0"
            width="190"
            height="42"
            rx="6"
            fill="rgba(10, 10, 15, 0.7)"
            stroke="var(--border-subtle)"
            strokeWidth="1"
            style={{ backdropFilter: 'blur(10px)' }}
          />
          <circle cx="15" cy="21" r="3" fill="#10b981" className={styles.blinkingDot} />
          <text
            x="30"
            y="26"
            fill="var(--text-muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            letterSpacing="0.5"
          >
            SYS_STATUS: <tspan fill="#10b981">ONLINE</tspan>
          </text>
        </g>

        <g transform="translate(270, 330)">
          <rect
            x="0"
            y="0"
            width="190"
            height="42"
            rx="6"
            fill="rgba(10, 10, 15, 0.7)"
            stroke="var(--border-subtle)"
            strokeWidth="1"
            style={{ backdropFilter: 'blur(10px)' }}
          />
          <text
            x="15"
            y="26"
            fill="var(--accent-secondary)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            letterSpacing="0.5"
            className={styles.textSearch}
          >
            SEARCHING ROLES...
          </text>
          <text
            x="15"
            y="26"
            fill="var(--accent-primary)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            letterSpacing="0.5"
            className={styles.textAnalyze}
          >
            SCORING MATCHES...
          </text>
          <text
            x="15"
            y="26"
            fill="#10b981"
            fontSize="11"
            fontFamily="var(--font-mono)"
            letterSpacing="0.5"
            className={styles.textTailor}
          >
            TAILORING RESUMES...
          </text>
          <text
            x="15"
            y="26"
            fill="var(--text-high-contrast)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            letterSpacing="0.5"
            className={styles.textApply}
          >
            APPLYING TO JOBS...
          </text>
        </g>
      </svg>
    </div>
  );
}
