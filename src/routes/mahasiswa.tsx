import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, ScanSearch } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/certichain/dashboard-shell";
import { useSession } from "@/hooks/use-certichain";

export const Route = createFileRoute("/mahasiswa")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard Mahasiswa — CertiChain" }, { name: "robots", content: "noindex" }] }),
  component: StudentLayout,
});

const NAV: NavItem[] = [
  { to: "/mahasiswa", label: "Sertifikat Saya", icon: LayoutDashboard, exact: true },
  { to: "/verifikasi", label: "Verifikasi Publik", icon: ScanSearch },
];

function StudentLayout() {
  const session = useSession();
  if (session?.role !== "student") return <Navigate to="/login" />;
  return (
    <DashboardShell items={NAV}>
      <Outlet />
    </DashboardShell>
  );
}
