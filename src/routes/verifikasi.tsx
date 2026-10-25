import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, CircleDashed, FileUp, Loader2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/certichain/public-layout";
import { StatusBadge } from "@/components/certichain/badges";
import { VerificationService, type VerificationReport } from "@/lib/certichain/verification-service";
import { fmtDate, fmtDateTime } from "@/lib/certichain/format";

export const Route = createFileRoute("/verifikasi")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { kode?: string } => (typeof s["kode"] === "string" ? { kode: s["kode"] } : {}),
  head: () => ({
    meta: [
      { title: "Verifikasi Sertifikat — CertiChain" },
      { name: "description", content: "Periksa keaslian dan status sertifikat kegiatan kampus berdasarkan kode atau file PDF." },
      { property: "og:title", content: "Verifikasi Sertifikat — CertiChain" },
      { property: "og:description", content: "Masukkan kode sertifikat atau unggah PDF untuk memeriksa status VALID, REVOKED, atau UNVERIFIED." },
    ],
  }),
  component: Verify,
});

const MESSAGES = {
  VALID: "Sertifikat ditemukan, penerbit dikenali, belum dicabut, dan bukti integritas sesuai.",
  REVOKED: "Sertifikat ditemukan tetapi telah dicabut oleh penerbit. Jangan gunakan sebagai bukti.",
  NOT_FOUND: "Tidak ada sertifikat dengan kode atau file tersebut.",
  UNVERIFIED: "Sertifikat ditemukan, tetapi bukti penerbitan atau integritasnya belum dapat dipastikan.",
};

function Verify() {
  const { kode } = Route.useSearch();
  const navigate = useNavigate({ from: "/verifikasi" });
  const [code, setCode] = useState(kode ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (c: string, f: File | null) => {
    setError("");
    if (!c.trim() && !f) return setError("Masukkan kode sertifikat atau unggah file PDF.");
    if (f && f.type !== "application/pdf") return setError("File harus berformat PDF.");
    setBusy(true);
    try {
      setReport(f ? await VerificationService.verifyFile(f, c) : await VerificationService.verifyByCode(c));
      if (c.trim()) navigate({ search: { kode: c.trim().toUpperCase() }, replace: true });
    } catch (e) {
      setReport(null);
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setError(offline ? "Tidak ada koneksi internet. Periksa jaringan Anda lalu coba lagi." : (e as Error)?.message === "DATABASE_ERROR" ? "Database verifikasi sedang tidak dapat diakses. Coba beberapa saat lagi." : "Gagal menghubungi server verifikasi. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (kode) void run(kode, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const c = report?.certificate;
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-primary sm:text-4xl">Verifikasi Sertifikat</h1>
        <p className="mt-2 text-muted-foreground">Tanpa login. Data pribadi pemilik sertifikat tidak ditampilkan.</p>

        <form onSubmit={(e) => { e.preventDefault(); void run(code, file); }} className="mt-8 space-y-4 rounded-lg border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="kode">Kode sertifikat</Label>
            <Input id="kode" placeholder="CERT-2026-0001" value={code} onChange={(e) => setCode(e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>File PDF (opsional, untuk cek integritas dokumen)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><FileUp /> Pilih PDF</Button>
              <span className="text-sm text-muted-foreground">{file ? file.name : "Belum ada file"}</span>
              {file && <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}>Hapus</Button>}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Search />} Verifikasi Sekarang</Button>
        </form>

        {busy && !report && <div className="mt-6 h-40 animate-pulse rounded-lg bg-muted" />}
        {report && (
          <section className="mt-6 rounded-lg border p-5" aria-live="polite">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={report.result} className="px-3 py-1 text-sm" />
              <span className="font-mono text-sm">{report.query}</span>
            </div>
            <p className="mt-3 text-sm">{MESSAGES[report.result]}</p>
            {c && (
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["Kode sertifikat", c.code],
                  ["Pemegang", c.holder],
                  ["Nama kegiatan", c.activity],
                  ["Penyelenggara", c.organizer],
                  ["Penerbit", c.issuerName],
                  ["Tanggal penerbitan", fmtDate(c.issueDate)],
                  ...(c.revokedAt ? [["Dicabut pada", fmtDateTime(c.revokedAt)], ["Alasan", c.revokeReason ?? "-"]] : []),
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground uppercase">{k}</dt><dd className="mt-0.5 text-sm">{v}</dd></div>
                ))}
              </dl>
            )}
            {report.checks.length > 0 && (
              <ul className="mt-5 space-y-2 border-t pt-4">
                {report.checks.map((ch) => (
                  <li key={ch.label} className="flex gap-2 text-sm">
                    {ch.ok === null ? <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : ch.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                    <span><span className="font-medium">{ch.label}</span> — <span className="text-muted-foreground">{ch.detail}</span></span>
                  </li>
                ))}
              </ul>
            )}
            {report.file && <p className="mt-3 font-mono text-xs break-all text-muted-foreground">SHA-256 file: {report.file.hash}</p>}
            {c?.chainMode === "demo" && <p className="mt-3 text-xs text-warning">Mode demo: pemeriksaan registri memakai registri simulasi di database bersama, bukan blockchain nyata.</p>}
            <p className="mt-2 text-xs text-muted-foreground">Diperiksa {fmtDateTime(report.checkedAt)}</p>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
