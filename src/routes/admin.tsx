import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { FilePlus2, Files, History, LayoutDashboard, RotateCcw, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, type NavItem } from "@/components/certichain/dashboard-shell";
import { useSession } from "@/hooks/use-certichain";
import { CertificateService } from "@/lib/certichain/certificate-service";

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

function AdminLayout() {
  const session = useSession();
  if (session?.role !== "admin") return <Navigate to="/login" search={{ peran: "admin" }} />;
  return (
    <DashboardShell
      items={NAV}
      footer={
        <button
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-sidebar-accent"
          onClick={async () => {
            if (!confirm("Kembalikan semua data demo ke kondisi awal?")) return;
            await CertificateService.resetDemo();
            toast.success("Data demo direset");
          }}
        >
          <RotateCcw className="size-3.5" /> Reset data demo
        </button>
      }
    >
      <Outlet />
    </DashboardShell>
  );
}
