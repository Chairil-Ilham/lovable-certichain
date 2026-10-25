import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, ScanSearch } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/certichain/dashboard-shell";
import { RoleGate } from "@/components/certichain/auth-gate";

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
  return (
    <RoleGate role="student">
      <DashboardShell items={NAV}>
        <Outlet />
      </DashboardShell>
    </RoleGate>
  );
}
