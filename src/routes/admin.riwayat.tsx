import { createFileRoute, Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/certichain/dashboard-shell";
import { useCertificates } from "@/hooks/use-certichain";
import { fmtDateTime } from "@/lib/certichain/format";
import { blockchainService } from "@/lib/certichain/blockchain-service";

export const Route = createFileRoute("/admin/riwayat")({ component: History });

const LABEL = {
  ISSUED: "Diterbitkan",
  CHAIN_REGISTERED: "Dicatat ke registri",
  CHAIN_FAILED: "Pencatatan gagal",
  REVOKED: "Dicabut",
  CHAIN_REVOKED: "Pencabutan dicatat",
} as const;

function History() {
  const { certificates } = useCertificates();
  const events = certificates
    .flatMap((c) => c.events.map((e) => ({ ...e, code: c.code })))
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <PageHeader title="Riwayat Pencatatan" description={`Mode: ${blockchainService.mode === "demo" ? "simulasi lokal — tidak ada transaksi blockchain nyata" : "EVM"}`} />
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Sertifikat</TableHead>
              <TableHead>Peristiwa</TableHead>
              <TableHead className="hidden md:table-cell">Oleh</TableHead>
              <TableHead className="hidden md:table-cell">Referensi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap text-xs">{fmtDateTime(e.at)}</TableCell>
                <TableCell>
                  <Link to="/admin/sertifikat/$kode" params={{ kode: e.code }} className="font-mono text-xs hover:underline">
                    {e.code}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{LABEL[e.type]}</TableCell>
                <TableCell className="hidden text-sm md:table-cell">{e.actor}</TableCell>
                <TableCell className="hidden font-mono text-xs md:table-cell">{e.reference ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
