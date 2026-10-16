import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Eye, FileX2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChainBadge, StatusBadge } from "./badges";
import { CopyLinkButton, DownloadPdfButton, QrDialogButton, RevokeButton } from "./cert-actions";
import { displayStatus } from "@/lib/certichain/rules";
import { fmtDate } from "@/lib/certichain/format";
import type { Certificate, DisplayStatus } from "@/lib/certichain/types";

type Role = "admin" | "student";

export function CertificateTable({ certificates, role, loading }: { certificates: Certificate[]; role: Role; loading?: boolean | undefined }) {
  if (loading)
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  if (!certificates.length)
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted-foreground">
        <FileX2 className="size-8" />
        <p className="text-sm">Tidak ada sertifikat yang cocok.</p>
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kode</TableHead>
          {role === "admin" && <TableHead>Mahasiswa</TableHead>}
          <TableHead>Kegiatan</TableHead>
          <TableHead className="hidden md:table-cell">Terbit</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden lg:table-cell">Blockchain</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {certificates.map((c) => (
          <TableRow key={c.code}>
            <TableCell className="font-mono text-xs font-medium">{c.code}</TableCell>
            {role === "admin" && <TableCell className="whitespace-nowrap">{c.studentName}</TableCell>}
            <TableCell className="min-w-44">{c.activity}</TableCell>
            <TableCell className="hidden whitespace-nowrap md:table-cell">{fmtDate(c.issueDate)}</TableCell>
            <TableCell>
              <StatusBadge status={displayStatus(c)} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <ChainBadge status={c.chainStatus} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button asChild variant="outline" size="icon" aria-label="Lihat detail">
                  {role === "admin" ? (
                    <Link to="/admin/sertifikat/$kode" params={{ kode: c.code }}>
                      <Eye />
                    </Link>
                  ) : (
                    <Link to="/mahasiswa/sertifikat/$kode" params={{ kode: c.code }}>
                      <Eye />
                    </Link>
                  )}
                </Button>
                <DownloadPdfButton cert={c} size="icon" />
                <QrDialogButton code={c.code} size="icon" />
                {role === "student" && <CopyLinkButton code={c.code} size="icon" />}
                {role === "admin" && <RevokeButton cert={c} size="icon" />}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const PAGE = 6;

export function CertificateBrowser({ certificates, role, loading }: { certificates: Certificate[]; role: Role; loading?: boolean | undefined }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | DisplayStatus>("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return certificates.filter(
      (c) =>
        (status === "ALL" || displayStatus(c) === status) &&
        (!term || c.code.toLowerCase().includes(term) || c.activity.toLowerCase().includes(term)),
    );
  }, [certificates, q, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE, current * PAGE);

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari kode sertifikat atau nama kegiatan"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as typeof status);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua status</SelectItem>
            <SelectItem value="VALID">VALID</SelectItem>
            <SelectItem value="REVOKED">REVOKED</SelectItem>
            <SelectItem value="UNVERIFIED">UNVERIFIED</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CertificateTable certificates={rows} role={role} loading={loading} />
      <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-muted-foreground">
        <span>
          {filtered.length} sertifikat · halaman {current} dari {pages}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" aria-label="Sebelumnya" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Berikutnya" disabled={current >= pages} onClick={() => setPage(current + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
