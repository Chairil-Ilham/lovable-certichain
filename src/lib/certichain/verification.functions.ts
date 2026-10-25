import { createServerFn } from "@tanstack/react-start";
import { HashService } from "./hash-service";
import { maskName } from "./format";
import { KNOWN_ISSUERS } from "./rules";
import type { VerificationCheck, VerificationReport } from "./verification-types";

const HASH_RE = /^[0-9a-f]{64}$/;

/**
 * Public verification. Runs on the server: reads the full certificate with
 * privileged access, re-checks everything, and returns only public fields
 * (masked name, no NIM, no internal notes/events).
 */
export const verifyCertificateFn = createServerFn({ method: "POST" })
  .inputValidator((input: { code?: string; fileHash?: string; fileName?: string }) => ({
    code: typeof input.code === "string" ? input.code.trim().toUpperCase().slice(0, 40) : "",
    fileHash: typeof input.fileHash === "string" && HASH_RE.test(input.fileHash) ? input.fileHash : undefined,
    fileName: typeof input.fileName === "string" ? input.fileName.slice(0, 200) : undefined,
  }))
  .handler(async ({ data }): Promise<VerificationReport> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const checkedAt = new Date().toISOString();
    if (!data.code && !data.fileHash) throw new Error("Kode atau file wajib diisi.");

    let query = supabaseAdmin.from("certificates").select("*");
    query = data.code ? query.eq("code", data.code) : query.eq("document_hash", data.fileHash!);
    const { data: cert, error } = await query.limit(1).maybeSingle();
    if (error) throw new Error("DATABASE_ERROR");

    const file = data.fileHash ? { name: data.fileName ?? "file.pdf", hash: data.fileHash, matches: !!cert?.document_hash && cert.document_hash === data.fileHash } : undefined;
    if (!cert) {
      return {
        query: data.code || file?.name || "",
        result: "NOT_FOUND",
        checks: file && !data.code ? [{ label: "Integritas file PDF", ok: false, detail: "Tidak ada sertifikat dengan hash file ini." }] : [],
        file,
        checkedAt,
      };
    }

    const checks: VerificationCheck[] = [];
    const issuerOk = KNOWN_ISSUERS.some((i) => i.id === cert.issuer_id);
    checks.push({ label: "Penerbit dikenali", ok: issuerOk, detail: issuerOk ? cert.issuer_name : "Penerbit tidak terdaftar." });

    const recomputed = await HashService.hashCertificate({
      code: cert.code,
      issuerId: cert.issuer_id,
      studentName: cert.student_name,
      nim: cert.nim,
      activity: cert.activity,
      organizer: cert.organizer,
      activityDate: cert.activity_date,
      issueDate: cert.issue_date,
      notes: cert.notes ?? undefined,
    });
    const dataOk = recomputed === cert.data_hash;
    checks.push({ label: "Hash data sertifikat konsisten", ok: dataOk, detail: dataOk ? "Hash SHA-256 dihitung ulang dan cocok." : "Data tersimpan berbeda dari hash referensi." });

    const { data: rec, error: recErr } = await supabaseAdmin.from("chain_registry").select("*").eq("certificate_code", cert.code).maybeSingle();
    if (recErr) throw new Error("DATABASE_ERROR");
    const regOk = !!rec && rec.hash === cert.data_hash;
    checks.push({
      label: "Tercatat di registri simulasi",
      ok: regOk,
      detail: !rec ? "Bukti pencatatan belum tersedia." : regOk ? `Referensi ${rec.reference}` : "Hash di registri tidak sesuai.",
    });
    const revoked = cert.status === "REVOKED" || !!rec?.revoked;
    checks.push({ label: "Belum dicabut", ok: !revoked, detail: revoked ? "Sertifikat telah dicabut oleh penerbit." : "Tidak ada catatan pencabutan." });

    if (file) {
      checks.push({ label: "Integritas file PDF", ok: file.matches, detail: file.matches ? "Hash file sama dengan referensi tersimpan." : "Hash file berbeda — file mungkin diubah atau bukan dokumen resmi." });
    } else {
      checks.push({ label: "Integritas file PDF", ok: null, detail: "Belum diperiksa — unggah file PDF untuk membandingkan hash." });
    }

    const result = revoked ? "REVOKED" : !issuerOk || !dataOk || !regOk || (file && !file.matches) ? "UNVERIFIED" : "VALID";
    return {
      query: cert.code,
      result,
      certificate: {
        code: cert.code,
        holder: maskName(cert.student_name),
        activity: cert.activity,
        organizer: cert.organizer,
        issuerName: cert.issuer_name,
        activityDate: cert.activity_date,
        issueDate: cert.issue_date,
        revokedAt: cert.revoked_at ?? undefined,
        revokeReason: cert.revoke_reason ?? undefined,
        dataHash: cert.data_hash,
        chainReference: cert.chain_reference ?? undefined,
        chainMode: cert.chain_mode === "evm" ? "evm" : "demo",
      },
      checks,
      file,
      checkedAt,
    };
  });
