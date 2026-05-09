import { cn } from "@/lib/cn";
import type { RegisterRole, RoleOption } from "./auth-config";

export type RoleSelectorProps = {
  options: RoleOption[];
  value: RegisterRole | null;
  onChange: (role: RegisterRole) => void;
  className?: string;
};

export function RoleSelector({
  options,
  value,
  onChange,
  className,
}: RoleSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Account type"
      className={cn("grid grid-cols-1 gap-2", className)}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.key)}
            className={cn(
              "group flex items-start gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1",
              selected
                ? "border-accent bg-accent/[0.06]"
                : "border-border bg-surface-1 hover:border-border-strong hover:bg-surface-2",
            )}
          >
            <span
              className={cn(
                "shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                selected
                  ? "bg-accent/20 text-accent"
                  : "bg-surface-2 text-fg-muted group-hover:text-fg",
              )}
            >
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[16.5px] font-semibold leading-snug text-fg">
                {opt.title}
              </span>
              <span className="mt-1 block text-[14px] text-fg-subtle leading-relaxed">
                {opt.description}
              </span>
            </span>
            <span
              className={cn(
                "mt-1 shrink-0 h-4 w-4 rounded-full border-[1.5px] relative transition-colors",
                selected ? "border-accent" : "border-border-strong",
              )}
              aria-hidden
            >
              {selected && (
                <span className="absolute inset-[3px] rounded-full bg-accent" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
