import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, Fingerprint, Lock, QrCode, ScanSearch, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/certichain/public-layout";
import hero from "@/assets/hero-certificate.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CertiChain — Sertifikat Kampus Terverifikasi Digital" },
      { name: "description", content: "Terbitkan dan verifikasi sertifikat kegiatan kampus dengan hash SHA-256, QR Code, dan konsep blockchain." },
      { property: "og:title", content: "CertiChain — Sertifikat Kampus Terverifikasi Digital" },
      { property: "og:description", content: "Verifikasi keaslian dan status sertifikat kegiatan kampus melalui kode atau QR Code." },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: FileCheck2, title: "Sertifikat diterbitkan", text: "Admin kampus menerbitkan sertifikat dengan kode unik." },
  { icon: Fingerprint, title: "Bukti integritas dibuat", text: "Sistem menghitung hash SHA-256 dan mencatatnya ke registri." },
  { icon: QrCode, title: "Diverifikasi publik", text: "Siapa pun memeriksa status melalui kode atau QR Code." },
];
const FEATURES = [
  { icon: ScanSearch, title: "Verifikasi tanpa login", text: "Halaman publik untuk penyelenggara dan perekrut." },
  { icon: ShieldOff, title: "Pencabutan real-time", text: "Status dicabut langsung terlihat saat diverifikasi." },
  { icon: Fingerprint, title: "Cek file PDF", text: "Unggah PDF untuk mendeteksi perubahan dokumen." },
  { icon: Lock, title: "Privasi terjaga", text: "Data pribadi tetap off-chain, hanya hash yang dicatat." },
];

function Landing() {
  return (
    <PublicLayout>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-widest text-accent-foreground uppercase">Sistem Sertifikat Akademik Terverifikasi</p>
          <h1 className="text-4xl leading-tight font-semibold text-primary sm:text-5xl">Sertifikat Kampus, Terverifikasi Secara Digital.</h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            CertiChain mencatat sidik jari digital (hash SHA-256) setiap sertifikat kegiatan kampus, sehingga keaslian dan statusnya dapat diperiksa siapa saja dalam hitungan detik.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/verifikasi">Verifikasi Sertifikat</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Masuk Dashboard</Link></Button>
          </div>
        </div>
        <img src={hero} alt="Sertifikat akademik dengan QR Code verifikasi" width={1280} height={960} className="rounded-xl border object-cover shadow-sm" />
      </section>

      <section id="cara-kerja" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-semibold text-primary">Cara kerja</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-lg border bg-background p-5">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-2xl font-semibold text-highlight">0{i + 1}</span>
                  <s.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-semibold text-primary">Fitur unggulan</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border p-5">
              <f.icon className="size-5 text-highlight" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
