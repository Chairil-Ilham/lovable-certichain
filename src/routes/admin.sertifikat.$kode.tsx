import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/certichain/dashboard-shell";
import { CertificateDetail } from "@/components/certichain/certificate-detail";
import { useCertificates } from "@/hooks/use-certichain";

export const Route = createFileRoute("/admin/sertifikat/$kode")({ component: AdminDetail });

function AdminDetail() {
  const { kode } = Route.useParams();
  const { ready, certificates } = useCertificates();
  const cert = certificates.find((c) => c.code === kode);
  return (
    <>
      <Link to="/admin/sertifikat" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali ke daftar
      </Link>
      <PageHeader title={cert ? cert.activity : "Detail sertifikat"} description={kode} />
      {!ready ? <Skeleton className="h-96 w-full" /> : cert ? <CertificateDetail cert={cert} role="admin" /> : <p className="text-muted-foreground">Sertifikat {kode} tidak ditemukan.</p>}
    </>
  );
}
