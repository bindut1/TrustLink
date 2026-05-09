type LogoProps = { size?: number };

export function Logo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 2 L28 8 V18 C28 24 22 28 16 30 C10 28 4 24 4 18 V8 Z"
        fill="var(--accent)"
        fillOpacity="0.14"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />
      <path
        d="M11 16 L14.5 19.5 L21 13"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="16" cy="9" r="1.5" fill="var(--accent)" />
    </svg>
  );
}
