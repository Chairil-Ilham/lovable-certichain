import { createFileRoute } from "@tanstack/react-router";
import { Files, ShieldCheck } from "lucide-react";
import { PageHeader, StatCard } from "@/components/certichain/dashboard-shell";
import { CertificateBrowser } from "@/components/certichain/certificate-table";
import { useCertificates, useSession } from "@/hooks/use-certichain";
import { displayStatus } from "@/lib/certichain/rules";

export const Route = createFileRoute("/mahasiswa/")({ component: StudentDashboard });

function StudentDashboard() {
  const session = useSession();
  const { ready, certificates } = useCertificates();
  const mine = session?.role === "student" ? certificates.filter((c) => c.nim === session.nim) : [];
  return (
    <>
      <PageHeader title={`Halo, ${session?.name ?? ""}`} description="Sertifikat kegiatan yang tercatat atas nama Anda." />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Total sertifikat" value={mine.length} icon={Files} />
        <StatCard label="Sertifikat valid" value={mine.filter((c) => displayStatus(c) === "VALID").length} icon={ShieldCheck} />
      </div>
      <CertificateBrowser certificates={mine} role="student" loading={!ready} />
    </>
  );
}
