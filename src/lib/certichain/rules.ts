import type { Certificate, CertificateInput, DisplayStatus, Issuer } from "./types";

export const KNOWN_ISSUERS: Issuer[] = [
  { id: "ISSUER-UNF-001", name: "Universitas Nusantara Fiktif (Prototype)" },
];
export const DEFAULT_ISSUER = KNOWN_ISSUERS[0];

export function nextCertificateCode(existingCodes: string[], year: number): string {
  const prefix = `CERT-${year}-`;
  const max = existingCodes
    .filter((c) => c.startsWith(prefix))
    .map((c) => parseInt(c.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateCertificateInput(input: CertificateInput) {
  const e: Partial<Record<keyof CertificateInput, string>> = {};
  const name = input.studentName.trim();
  if (name.length < 3 || name.length > 80) e.studentName = "Nama 3–80 karakter.";
  else if (!/^[\p{L} .'-]+$/u.test(name)) e.studentName = "Nama hanya boleh huruf, spasi, titik, atau tanda hubung.";
  if (!/^[A-Za-z0-9-]{4,20}$/.test(input.nim.trim())) e.nim = "NIM 4–20 karakter (huruf, angka, tanda hubung).";
  if (input.activity.trim().length < 3 || input.activity.trim().length > 120) e.activity = "Nama kegiatan 3–120 karakter.";
  if (input.organizer.trim().length < 3 || input.organizer.trim().length > 120) e.organizer = "Penyelenggara 3–120 karakter.";
  if (!DATE_RE.test(input.activityDate)) e.activityDate = "Tanggal kegiatan wajib diisi.";
  if (!DATE_RE.test(input.issueDate)) e.issueDate = "Tanggal penerbitan wajib diisi.";
  else if (DATE_RE.test(input.activityDate) && input.issueDate < input.activityDate)
    e.issueDate = "Tanggal penerbitan tidak boleh sebelum tanggal kegiatan.";
  if ((input.notes ?? "").length > 300) e.notes = "Keterangan maksimal 300 karakter.";
  return e;
}

/** Quick status for lists. Full checks happen in VerificationService. */
export function displayStatus(c: Pick<Certificate, "status" | "chainStatus">): DisplayStatus {
  if (c.status === "REVOKED") return "REVOKED";
  if (c.chainStatus === "SIMULATED" || c.chainStatus === "CONFIRMED") return "VALID";
  return "UNVERIFIED";
}
