// Custom SVG icon set for the homepage — deliberately not a generic icon
// library. Every icon is a navy silhouette + a single cyan accent stroke,
// echoing the arrow-through-globe language of the Mach XX11 logo, so the
// mark's own visual system carries through the whole page instead of
// looking bolted onto a stock icon set.

type IconProps = { className?: string };

export function ShipIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M8 40h48l-6 14H14L8 40Z" fill="currentColor" opacity="0.15" />
      <path d="M8 40h48l-6 14H14L8 40Z" stroke="currentColor" strokeWidth="2" />
      <rect x="16" y="24" width="8" height="16" fill="currentColor" opacity="0.85" />
      <rect x="27" y="20" width="8" height="20" fill="currentColor" opacity="0.85" />
      <rect x="38" y="26" width="8" height="14" fill="currentColor" opacity="0.85" />
      <path d="M4 46c4 4 8 4 12 0s8-4 12 0 8 4 12 0 8-4 12 0" stroke="var(--hp-cyan)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PlaneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path
        d="M6 34l20-4 8-18c1-2 4-2 4 0l-2 18 18 6-1 4-18-2-4 12 6 4-1 3-9-2-9 2-1-3 6-4-4-12-18 2-1-4Z"
        fill="currentColor" opacity="0.85" stroke="currentColor" strokeWidth="1.2"
      />
      <path d="M4 50c14 6 42 6 56 0" stroke="var(--hp-cyan)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <rect x="6" y="22" width="30" height="18" fill="currentColor" opacity="0.85" />
      <path d="M36 28h12l8 8v4h-20V28Z" fill="currentColor" opacity="0.6" />
      <circle cx="18" cy="44" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="46" cy="44" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M2 40h6M52 30l6 8" stroke="var(--hp-cyan)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <rect x="10" y="18" width="44" height="20" rx="3" fill="currentColor" opacity="0.85" />
      <rect x="16" y="24" width="10" height="8" fill="var(--hp-fog)" opacity="0.8" />
      <rect x="30" y="24" width="10" height="8" fill="var(--hp-fog)" opacity="0.8" />
      <circle cx="20" cy="42" r="4" fill="currentColor" />
      <circle cx="44" cy="42" r="4" fill="currentColor" />
      <path d="M4 48h56" stroke="var(--hp-cyan)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function WarehouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M8 28 32 14l24 14v22H8V28Z" fill="currentColor" opacity="0.85" />
      <rect x="27" y="34" width="10" height="16" fill="var(--hp-fog)" opacity="0.85" />
      <path d="M32 14 8 28" stroke="var(--hp-cyan)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function BoxIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M32 8 56 20v24L32 56 8 44V20L32 8Z" fill="currentColor" opacity="0.85" />
      <path d="M8 20 32 32l24-12M32 32v24" stroke="var(--hp-fog)" strokeWidth="1.5" opacity="0.8" />
      <path d="M32 8 56 20" stroke="var(--hp-cyan)" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}

export function ParcelIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <rect x="14" y="18" width="36" height="28" rx="2" fill="currentColor" opacity="0.85" />
      <path d="M14 26h36M32 26v20" stroke="var(--hp-fog)" strokeWidth="1.5" opacity="0.8" />
      <path d="M20 18 44 46" stroke="var(--hp-cyan)" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="32" cy="32" rx="9" ry="22" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <path d="M10 32h44" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <path d="M10 22c8 6 36 6 44 0M10 42c8-6 36-6 44 0" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <path d="M6 36c10 8 42 8 52 0" stroke="var(--hp-cyan)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
