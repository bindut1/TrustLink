import Link from "next/link";
import { Logo } from "@/components/auth/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        aria-label="TrustLink home"
        className="flex items-center gap-3 mb-9"
      >
        <Logo size={36} />
        <span className="text-[22px] font-bold tracking-[-0.025em] text-fg">
          TrustLink
        </span>
      </Link>
      {children}
    </div>
  );
}
