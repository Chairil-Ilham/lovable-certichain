import { createFileRoute, Outlet } from "@tanstack/react-router";
import { FilePlus2, Files, History, LayoutDashboard, Download, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, type NavItem } from "@/components/certichain/dashboard-shell";
import { RoleGate } from "@/components/certichain/auth-gate";
import { LEGACY_LOCAL_KEYS } from "@/lib/certichain/certificate-service";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard Admin — CertiChain" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/sertifikat", label: "Daftar Sertifikat", icon: Files, exact: true },
  { to: "/admin/sertifikat/baru", label: "Tambah Sertifikat", icon: FilePlus2 },
  { to: "/admin/riwayat", label: "Riwayat Pencatatan", icon: History },
  { to: "/verifikasi", label: "Verifikasi Publik", icon: ScanSearch },
];

function downloadLocalBackup() {
  const backup: Record<string, unknown> = {};
  for (const k of LEGACY_LOCAL_KEYS) {
    const v = localStorage.getItem(k);
    if (v) backup[k] = JSON.parse(v);
  }
  if (!Object.keys(backup).length) {
    toast.info("Tidak ada data lama di browser ini.");
    return;
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "certichain-cadangan-lokal.json" });
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Cadangan data lama diunduh (tidak diunggah ke database)");
}

function AdminLayout() {
  return (
    <RoleGate role="admin">
      <DashboardShell
        items={NAV}
        footer={
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-sidebar-accent" onClick={downloadLocalBackup}>
            <Download className="size-3.5" /> Unduh cadangan data lama
          </button>
        }
      >
        <Outlet />
      </DashboardShell>
    </RoleGate>
  );
}
