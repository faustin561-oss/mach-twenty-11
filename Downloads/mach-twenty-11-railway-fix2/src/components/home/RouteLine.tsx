// Signature element: the same "route" the logo depicts — an arrow tracing
// a path across a globe — extended into an ambient background motif. It
// reappears (in simpler form) as the connector in the How It Works section
// and as a hairline in the footer, so the one idea threads the whole page
// instead of being a one-off hero decoration.

export default function RouteLine() {
  return (
    <svg
      viewBox="0 0 1200 500"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path
        d="M -50 380 C 200 460, 380 120, 620 200 S 1000 40, 1260 140"
        fill="none"
        stroke="var(--hp-cyan)"
        strokeWidth="1.5"
        strokeOpacity="0.45"
        strokeDasharray="6 10"
        className="hp-motion"
        style={{ animation: "hp-dash 14s linear infinite" }}
      />
      <path
        d="M -50 380 C 200 460, 380 120, 620 200 S 1000 40, 1260 140"
        fill="none"
        stroke="var(--hp-cyan)"
        strokeWidth="0.75"
        strokeOpacity="0.2"
      />
      {[
        { cx: 120, cy: 410 },
        { cx: 500, cy: 175 },
        { cx: 900, cy: 90 },
      ].map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r="5"
          fill="var(--hp-cyan)"
          className="hp-motion"
          style={{ animation: `hp-pulse 2.6s ease-in-out ${i * 0.6}s infinite` }}
        />
      ))}
    </svg>
  );
}
