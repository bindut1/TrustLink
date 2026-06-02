import Image from "next/image";

type LogoProps = {
  size?: number;
  /** "icon" = logo mark only; "full" = icon + TrustLink text */
  variant?: "icon" | "full";
};

export function Logo({ size = 28, variant = "icon" }: LogoProps) {
  if (variant === "full") {
    // Preserve aspect ratio: full-logo is ~4.2:1 (w:h)
    const height = Math.round(size);
    const width = Math.round(height * 4.2);
    return (
      <Image
        src="/full-logo.webp"
        alt="TrustLink"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    );
  }

  return (
    <Image
      src="/logo.webp"
      alt="TrustLink"
      width={size}
      height={size}
      priority
      className="object-contain"
    />
  );
}
