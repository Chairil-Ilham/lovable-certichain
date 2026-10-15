import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Loader2, QrCode, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CertificateService } from "@/lib/certichain/certificate-service";
import { downloadCertificatePdf } from "@/lib/certichain/pdf";
import { verificationUrl } from "@/lib/certichain/format";
import { useSession } from "@/hooks/use-certichain";
import type { Certificate } from "@/lib/certichain/types";

type Size = "sm" | "icon";

export function DownloadPdfButton({ cert, size = "sm", label = "PDF" }: { cert: Certificate; size?: Size; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size={size}
      disabled={busy}
      aria-label="Unduh PDF"
      onClick={async () => {
        setBusy(true);
        try {
          await downloadCertificatePdf(cert);
          toast.success(`PDF ${cert.code} diunduh`);
        } catch {
          toast.error("Gagal membuat PDF");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      {size !== "icon" && label}
    </Button>
  );
}

export async function copyVerificationLink(code: string) {
  try {
    await navigator.clipboard.writeText(verificationUrl(code));
    toast.success("Tautan verifikasi disalin");
  } catch {
    toast.error("Tidak dapat menyalin tautan");
  }
}

export function CopyLinkButton({ code, size = "sm" }: { code: string; size?: Size }) {
  return (
    <Button variant="outline" size={size} aria-label="Salin tautan verifikasi" onClick={() => copyVerificationLink(code)}>
      <Copy />
      {size !== "icon" && "Salin tautan"}
    </Button>
  );
}

export function QrPanel({ code, size = 168 }: { code: string; size?: number }) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-lg border bg-background p-4">
      <QRCodeSVG value={verificationUrl(code)} size={size} level="M" />
      <span className="font-mono text-xs text-muted-foreground">{code}</span>
    </div>
  );
}

export function QrDialogButton({ code, size = "sm" }: { code: string; size?: Size }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size={size} aria-label="Tampilkan QR Code" onClick={() => setOpen(true)}>
        <QrCode />
        {size !== "icon" && "QR"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code verifikasi</DialogTitle>
            <DialogDescription>Pindai untuk membuka halaman verifikasi publik sertifikat ini.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <QrPanel code={code} size={208} />
            <p className="break-all text-center font-mono text-xs text-muted-foreground">{verificationUrl(code)}</p>
            <Button variant="secondary" size="sm" onClick={() => copyVerificationLink(code)}>
              <Copy /> Salin tautan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RevokeButton({ cert, size = "sm" }: { cert: Certificate; size?: Size }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (session?.role !== "admin" || cert.status === "REVOKED") return null;

  const submit = async () => {
    setBusy(true);
    try {
      await CertificateService.revoke(cert.code, reason, session);
      toast.success(`${cert.code} telah dicabut`);
      setOpen(false);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size={size} aria-label="Cabut sertifikat" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <ShieldOff />
        {size !== "icon" && "Cabut"}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cabut sertifikat {cert.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Status akan berubah menjadi REVOKED dan langsung terlihat oleh siapa pun yang memverifikasi. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="revoke-reason">Alasan pencabutan</Label>
            <Textarea id="revoke-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: data peserta tidak sesuai" maxLength={200} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <Button variant="destructive" disabled={busy || reason.trim().length < 5} onClick={submit}>
              {busy && <Loader2 className="animate-spin" />} Cabut sertifikat
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
