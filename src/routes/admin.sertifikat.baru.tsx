import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Eye, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/certichain/dashboard-shell";
import { ChainBadge } from "@/components/certichain/badges";
import { DownloadPdfButton, QrPanel } from "@/components/certichain/cert-actions";
import { useSession } from "@/hooks/use-certichain";
import { CertificateService } from "@/lib/certichain/certificate-service";
import { validateCertificateInput } from "@/lib/certichain/rules";
import type { Certificate, CertificateInput } from "@/lib/certichain/types";

export const Route = createFileRoute("/admin/sertifikat/baru")({ component: NewCertificate });

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY: CertificateInput = { studentName: "", nim: "", activity: "", organizer: "", activityDate: "", issueDate: today(), notes: "" };

const FIELDS: { key: keyof CertificateInput; label: string; type?: string; placeholder?: string }[] = [
  { key: "studentName", label: "Nama mahasiswa (dummy)", placeholder: "Mahasiswa Demo A" },
  { key: "nim", label: "NIM (dummy)", placeholder: "DEMO-0001" },
  { key: "activity", label: "Nama kegiatan kampus", placeholder: "Seminar Teknologi Hijau" },
  { key: "organizer", label: "Nama penyelenggara", placeholder: "Himpunan Mahasiswa (Fiktif)" },
  { key: "activityDate", label: "Tanggal kegiatan", type: "date" },
  { key: "issueDate", label: "Tanggal penerbitan", type: "date" },
];

function NewCertificate() {
  const session = useSession();
  const [form, setForm] = useState<CertificateInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CertificateInput, string>>>({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Certificate | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCertificateInput(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Periksa kembali isian formulir");
      return;
    }
    setBusy(true);
    try {
      const cert = await CertificateService.create(form, session);
      setCreated(cert);
      setForm({ ...EMPTY, issueDate: today() });
      if (cert.chainStatus === "FAILED") toast.warning(`${cert.code} tersimpan, tetapi pencatatan registri gagal`);
      else toast.success(`Sertifikat ${cert.code} berhasil diterbitkan`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Tambah Sertifikat" description="Gunakan data simulasi — jangan memasukkan data mahasiswa nyata." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} noValidate className="space-y-4 rounded-lg border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  value={form[f.key] ?? ""}
                  aria-invalid={!!errors[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
                {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Keterangan (opsional)</Label>
            <Textarea id="notes" maxLength={300} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Plus />} Terbitkan sertifikat
          </Button>
        </form>

        <aside className="rounded-lg border bg-card p-5">
          {created ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 className="size-5" /> Berhasil diterbitkan
              </p>
              <p className="font-mono text-sm font-semibold">{created.code}</p>
              <ChainBadge status={created.chainStatus} />
              <div>
                <p className="text-xs text-muted-foreground uppercase">SHA-256</p>
                <p className="font-mono text-xs break-all">{created.dataHash}</p>
              </div>
              <QrPanel code={created.code} size={150} />
              <div className="flex flex-wrap gap-2">
                <DownloadPdfButton cert={created} label="Unduh PDF" />
                <Button asChild variant="secondary" size="sm">
                  <Link to="/admin/sertifikat/$kode" params={{ kode: created.code }}>
                    <Eye /> Detail
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Yang terjadi saat diterbitkan</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Kode unik dibuat (CERT-TAHUN-NOMOR).</li>
                <li>Hash SHA-256 dihitung dari data sertifikat.</li>
                <li>PDF formal dan QR Code verifikasi dibuat.</li>
                <li>Hash dicatat ke registri simulasi (mode demo).</li>
              </ol>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
