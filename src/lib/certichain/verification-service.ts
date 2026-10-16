import { blockchainService } from "./blockchain-service";
import { CertificateService } from "./certificate-service";
import { maskName } from "./format";
import { HashService } from "./hash-service";
import { KNOWN_ISSUERS } from "./rules";
import type { Certificate, VerificationResult } from "./types";

export interface VerificationCheck {
  label: string;
  ok: boolean | null; // null = not checked
  detail: string;
}

export interface PublicCertificateView {
  code: string;
  holder: string; // masked
  activity: string;
  organizer: string;
  issuerName: string;
  activityDate: string;
  issueDate: string;
  revokedAt?: string | undefined;
  revokeReason?: string | undefined;
  dataHash: string;
  chainReference?: string | undefined;
  chainMode: Certificate["chainMode"];
}

export interface VerificationReport {
  query: string;
  result: VerificationResult;
  certificate?: PublicCertificateView;
  checks: VerificationCheck[];
  file?: { name: string; hash: string; matches: boolean };
  checkedAt: string;
}

function toPublic(c: Certificate): PublicCertificateView {
  return {
    code: c.code,
    holder: maskName(c.studentName),
    activity: c.activity,
    organizer: c.organizer,
    issuerName: c.issuerName,
    activityDate: c.activityDate,
    issueDate: c.issueDate,
    revokedAt: c.revokedAt,
    revokeReason: c.revokeReason,
    dataHash: c.dataHash,
    chainReference: c.chainReference,
    chainMode: c.chainMode,
  };
}

export const VerificationService = {
  async verifyByCode(rawCode: string, file?: File): Promise<VerificationReport> {
    await CertificateService.init();
    const query = rawCode.trim().toUpperCase();
    const checkedAt = new Date().toISOString();
    const cert = CertificateService.getByCode(query);
    if (!cert) return { query, result: "NOT_FOUND", checks: [], checkedAt };

    const checks: VerificationCheck[] = [];
    const issuerOk = KNOWN_ISSUERS.some((i) => i.id === cert.issuerId);
    checks.push({ label: "Penerbit dikenali", ok: issuerOk, detail: issuerOk ? cert.issuerName : "Penerbit tidak terdaftar." });

    const recomputed = await HashService.hashCertificate(cert);
    const dataOk = recomputed === cert.dataHash;
    checks.push({ label: "Hash data sertifikat konsisten", ok: dataOk, detail: dataOk ? "Hash SHA-256 dihitung ulang dan cocok." : "Data tersimpan berbeda dari hash referensi." });

    // Revocation & registry are always re-read at verification time.
    const rec = await blockchainService.getCertificate(cert.code);
    const regOk = !!rec && rec.hash === cert.dataHash;
    checks.push({
      label: blockchainService.mode === "demo" ? "Tercatat di registri simulasi" : "Tercatat di blockchain",
      ok: regOk,
      detail: !rec ? "Bukti pencatatan belum tersedia." : regOk ? `Referensi ${rec.reference}` : "Hash di registri tidak sesuai.",
    });
    const revoked = cert.status === "REVOKED" || !!rec?.revoked;
    checks.push({ label: "Belum dicabut", ok: !revoked, detail: revoked ? "Sertifikat telah dicabut oleh penerbit." : "Tidak ada catatan pencabutan." });

    let fileInfo: VerificationReport["file"];
    if (file) {
      const hash = await HashService.hashFile(file);
      const matches = !!cert.documentHash && hash === cert.documentHash;
      fileInfo = { name: file.name, hash, matches };
      checks.push({ label: "Integritas file PDF", ok: matches, detail: matches ? "Hash file sama dengan referensi tersimpan." : "Hash file berbeda — file mungkin diubah atau bukan dokumen resmi." });
    } else {
      checks.push({ label: "Integritas file PDF", ok: null, detail: "Belum diperiksa — unggah file PDF untuk membandingkan hash." });
    }

    let result: VerificationResult;
    if (revoked) result = "REVOKED";
    else if (!issuerOk || !dataOk || !regOk || (fileInfo && !fileInfo.matches)) result = "UNVERIFIED";
    else result = "VALID";

    return { query, result, certificate: toPublic(cert), checks, file: fileInfo, checkedAt };
  },

  /** Find the certificate by the uploaded file's hash when no code is given. */
  async verifyFile(file: File, code?: string): Promise<VerificationReport> {
    await CertificateService.init();
    if (code?.trim()) return this.verifyByCode(code, file);
    const hash = await HashService.hashFile(file);
    const cert = CertificateService.findByDocumentHash(hash);
    if (!cert)
      return {
        query: file.name,
        result: "NOT_FOUND",
        checks: [{ label: "Integritas file PDF", ok: false, detail: "Tidak ada sertifikat dengan hash file ini." }],
        file: { name: file.name, hash, matches: false },
        checkedAt: new Date().toISOString(),
      };
    return this.verifyByCode(cert.code, file);
  },
};
