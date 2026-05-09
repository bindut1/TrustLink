import { AppShell } from "@/components/app-shell/AppShell";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role="recruiter">{children}</AppShell>;
}
