import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/certichain/dashboard-shell";
import { CertificateDetail } from "@/components/certichain/certificate-detail";
import { useCertificates, useSession } from "@/hooks/use-certichain";

export const Route = createFileRoute("/mahasiswa/sertifikat/$kode")({ component: StudentDetail });

function StudentDetail() {
  const { kode } = Route.useParams();
  const session = useSession();
  const { ready, certificates } = useCertificates();
  // Students may only open certificates they own.
  const cert = certificates.find((c) => c.code === kode && session?.role === "student" && c.nim === session.nim);
  return (
    <>
      <Link to="/mahasiswa" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali
      </Link>
      <PageHeader title={cert ? cert.activity : "Detail sertifikat"} description={kode} />
      {!ready ? <Skeleton className="h-96 w-full" /> : cert ? <CertificateDetail cert={cert} role="student" /> : <p className="text-muted-foreground">Sertifikat tidak ditemukan atau bukan milik Anda.</p>}
    </>
  );
}
