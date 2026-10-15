import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FilePlus2, Files, Link2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard } from "@/components/certichain/dashboard-shell";
import { CertificateTable } from "@/components/certichain/certificate-table";
import { useCertificates } from "@/hooks/use-certichain";
import { displayStatus } from "@/lib/certichain/rules";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { ready, certificates } = useCertificates();

  const stats = useMemo(() => {
    const valid = certificates.filter((c) => displayStatus(c) === "VALID").length;
    const revoked = certificates.filter((c) => c.status === "REVOKED").length;
    const confirmed = certificates.filter((c) => c.chainStatus === "CONFIRMED").length;
    const simulated = certificates.filter((c) => c.chainStatus === "SIMULATED").length;
    return { total: certificates.length, valid, revoked, confirmed, simulated };
  }, [certificates]);

  const chart = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        bulan: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d),
        jumlah: certificates.filter((c) => c.issueDate.startsWith(key)).length,
      };
    });
  }, [certificates]);

  const latest = [...certificates].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard Admin"
        description="Ringkasan sertifikat kegiatan kampus."
        actions={
          <Button asChild>
            <Link to="/admin/sertifikat/baru">
              <FilePlus2 /> Tambah Sertifikat
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total sertifikat" value={stats.total} icon={Files} />
        <StatCard label="Sertifikat valid" value={stats.valid} icon={ShieldCheck} />
        <StatCard label="Sertifikat dicabut" value={stats.revoked} icon={ShieldOff} />
        <StatCard label="Transaksi blockchain berhasil" value={stats.confirmed} hint={`${stats.simulated} catatan simulasi (mode demo, bukan transaksi)`} icon={Link2} />
      </div>

      <section className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold text-primary">Sertifikat diterbitkan per bulan</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
              <Bar dataKey="jumlah" name="Sertifikat" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Sertifikat terbaru</h2>
          <Link to="/admin/sertifikat" className="text-sm font-medium text-accent-foreground hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="rounded-lg border bg-background">
          <CertificateTable certificates={latest} role="admin" loading={!ready} />
        </div>
      </section>
    </>
  );
}
