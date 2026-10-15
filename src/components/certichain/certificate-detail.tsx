import { CheckCircle2, Circle, ExternalLink, ShieldOff, TriangleAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChainBadge, StatusBadge } from "./badges";
import { CopyLinkButton, DownloadPdfButton, QrPanel, RevokeButton } from "./cert-actions";
import { displayStatus } from "@/lib/certichain/rules";
import { fmtDate, fmtDateTime } from "@/lib/certichain/format";
import type { Certificate, CertificateEvent } from "@/lib/certichain/types";

const EVENT_LABEL: Record<CertificateEvent["type"], string> = {
  ISSUED: "Sertifikat diterbitkan",
  CHAIN_REGISTERED: "Hash dicatat ke registri",
  CHAIN_FAILED: "Pencatatan gagal",
  REVOKED: "Sertifikat dicabut",
  CHAIN_REVOKED: "Pencabutan dicatat ke registri",
};

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={mono ? "mt-1 font-mono text-xs break-all" : "mt-1 text-sm"}>{children}</dd>
    </div>
  );
}

export function CertificateDetail({ cert, role }: { cert: Certificate; role: "admin" | "student" }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        {cert.status === "REVOKED" && (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-sm text-destructive">
            <ShieldOff className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Dicabut pada {fmtDateTime(cert.revokedAt)}</p>
              <p>Alasan: {cert.revokeReason}</p>
            </div>
          </div>
        )}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={displayStatus(cert)} />
            <ChainBadge status={cert.chainStatus} />
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Kode sertifikat" mono>{cert.code}</Field>
            <Field label="Nama mahasiswa">{cert.studentName}</Field>
            <Field label="NIM">{cert.nim}</Field>
            <Field label="Penerbit">{cert.issuerName}</Field>
            <Field label="Nama kegiatan">{cert.activity}</Field>
            <Field label="Penyelenggara">{cert.organizer}</Field>
            <Field label="Tanggal kegiatan">{fmtDate(cert.activityDate)}</Field>
            <Field label="Tanggal penerbitan">{fmtDate(cert.issueDate)}</Field>
            {cert.notes && <Field label="Keterangan">{cert.notes}</Field>}
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-primary">Bukti integritas</h2>
          <dl className="grid gap-4">
            <Field label="SHA-256 data sertifikat" mono>{cert.dataHash}</Field>
            <Field label="SHA-256 file PDF" mono>{cert.documentHash ?? "Sedang dihitung…"}</Field>
            {cert.txHash ? (
              <Field label="Transaction hash" mono>{cert.txHash}</Field>
            ) : (
              <Field label={cert.chainMode === "demo" ? "Referensi simulasi (bukan transaction hash)" : "Transaction hash"} mono>
                {cert.chainReference ?? "Belum tersedia"}
              </Field>
            )}
          </dl>
          {cert.chainMode === "demo" && (
            <p className="mt-4 flex gap-2 rounded-md bg-warning-soft p-3 text-xs text-warning">
              <TriangleAlert className="size-4 shrink-0" />
              Mode demo: hash dicatat ke registri simulasi lokal, bukan ke jaringan blockchain. Tidak ada transaksi nyata.
            </p>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-primary">Riwayat</h2>
          <ol className="space-y-4">
            {cert.events.map((e, i) => (
              <li key={i} className="flex gap-3">
                {e.type === "REVOKED" || e.type === "CHAIN_FAILED" ? (
                  <Circle className="mt-0.5 size-4 shrink-0 fill-destructive text-destructive" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                )}
                <div className="text-sm">
                  <p className="font-medium">{EVENT_LABEL[e.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDateTime(e.at)} · {e.actor}
                    {e.reference && <> · <span className="font-mono">{e.reference}</span></>}
                  </p>
                  {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="space-y-4">
        <QrPanel code={cert.code} size={200} />
        <div className="flex flex-col gap-2">
          <DownloadPdfButton cert={cert} label="Unduh PDF" />
          <CopyLinkButton code={cert.code} />
          <Button asChild variant="outline" size="sm">
            <Link to="/verifikasi" search={{ kode: cert.code }}>
              <ExternalLink /> Buka halaman verifikasi
            </Link>
          </Button>
          {role === "admin" && <RevokeButton cert={cert} />}
        </div>
      </aside>
    </div>
  );
}
