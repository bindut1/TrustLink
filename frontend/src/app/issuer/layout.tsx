import { AppShell } from "@/components/app-shell/AppShell";

export default function IssuerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role="issuer">{children}</AppShell>;
}
