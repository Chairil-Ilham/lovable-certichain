import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { fmtDate, verificationUrl } from "./format";
import type { Certificate } from "./types";

type PdfCert = Pick<
  Certificate,
  "code" | "studentName" | "activity" | "organizer" | "activityDate" | "issueDate" | "issuerName" | "dataHash" | "createdAt" | "notes"
>;

/** Deterministic: same certificate data always yields identical PDF bytes. */
export async function buildCertificatePdf(c: PdfCert): Promise<ArrayBuffer> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setCreationDate(new Date(c.createdAt));
  doc.setFileId(c.dataHash.slice(0, 32).toUpperCase());
  doc.setProperties({ title: `Sertifikat ${c.code}`, creator: "CertiChain Prototype" });

  const W = 297;
  const H = 210;
  const navy: [number, number, number] = [24, 39, 84];
  const cyan: [number, number, number] = [34, 160, 190];

  doc.setDrawColor(...navy);
  doc.setLineWidth(2.2);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setLineWidth(0.4);
  doc.rect(14, 14, W - 28, H - 28);

  doc.setTextColor(...navy);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text(c.issuerName.toUpperCase(), W / 2, 32, { align: "center" });

  doc.setFontSize(36);
  doc.text("SERTIFIKAT", W / 2, 56, { align: "center" });
  doc.setDrawColor(...cyan);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 30, 61, W / 2 + 30, 61);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(70, 80, 100);
  doc.text("Diberikan kepada", W / 2, 76, { align: "center" });

  doc.setFont("times", "bolditalic");
  doc.setFontSize(28);
  doc.setTextColor(...navy);
  doc.text(c.studentName, W / 2, 92, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(70, 80, 100);
  doc.text("atas partisipasinya dalam kegiatan", W / 2, 106, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...navy);
  doc.text(doc.splitTextToSize(c.activity, 200), W / 2, 117, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(70, 80, 100);
  doc.text(`Diselenggarakan oleh ${c.organizer} pada ${fmtDate(c.activityDate)}`, W / 2, 132, { align: "center" });
  if (c.notes) doc.text(doc.splitTextToSize(c.notes, 200), W / 2, 140, { align: "center" });

  // Footer block
  doc.setFontSize(10);
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.text(`Kode: ${c.code}`, 24, 168);
  doc.setFont("helvetica", "normal");
  doc.text(`Diterbitkan: ${fmtDate(c.issueDate)}`, 24, 174);
  doc.setFontSize(7);
  doc.setTextColor(110, 120, 140);
  doc.text(`SHA-256 data: ${c.dataHash}`, 24, 181);
  doc.text("Dokumen prototype mahasiswa — identitas kampus dan data bersifat fiktif.", 24, 186);

  const qr = await QRCode.toDataURL(verificationUrl(c.code), { margin: 0, width: 240, errorCorrectionLevel: "M" });
  doc.addImage(qr, "PNG", W - 58, 148, 34, 34);
  doc.setFontSize(7);
  doc.text("Pindai untuk verifikasi", W - 41, 186, { align: "center" });

  return doc.output("arraybuffer");
}

export async function downloadCertificatePdf(c: PdfCert) {
  const bytes = await buildCertificatePdf(c);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.code}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
