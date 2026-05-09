import { AppShell } from "@/components/app-shell/AppShell";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role="candidate">{children}</AppShell>;
}
