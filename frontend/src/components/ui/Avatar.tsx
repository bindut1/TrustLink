import { cn } from "@/lib/cn";

type AvatarProps = {
  /** Display name — used to derive initials when no image is present. */
  name: string;
  src?: string | null;
  /** Pixel size of the square avatar. */
  size?: number;
  className?: string;
};

/**
 * Circular user avatar. Renders the uploaded image when `src` is set, otherwise
 * falls back to initials on an accent-tinted background — the same look the app
 * shell used before avatars existed.
 */
export function Avatar({ name, src, size = 36, className }: AvatarProps) {
  const initials = getInitials(name);
  // Scale the fallback text to roughly the image's proportions.
  const fontSize = Math.round(size * 0.4);

  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-accent font-semibold",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <span style={{ fontSize }}>{initials}</span>
      )}
    </span>
  );
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
