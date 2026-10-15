import { createFileRoute, Link } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/certichain/dashboard-shell";
import { CertificateBrowser } from "@/components/certichain/certificate-table";
import { useCertificates } from "@/hooks/use-certichain";

export const Route = createFileRoute("/admin/sertifikat/")({ component: AdminList });

function AdminList() {
  const { ready, certificates } = useCertificates();
  return (
    <>
      <PageHeader
        title="Daftar Sertifikat"
        description="Cari, filter, lihat detail, dan cabut sertifikat."
        actions={
          <Button asChild>
            <Link to="/admin/sertifikat/baru">
              <FilePlus2 /> Tambah Sertifikat
            </Link>
          </Button>
        }
      />
      <CertificateBrowser certificates={certificates} role="admin" loading={!ready} />
    </>
  );
}
