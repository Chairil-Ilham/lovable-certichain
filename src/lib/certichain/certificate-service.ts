import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { blockchainService } from "./blockchain-service";
import { HashService } from "./hash-service";
import { DEFAULT_ISSUER, nextCertificateCode, validateCertificateInput } from "./rules";
import type { Certificate, CertificateEvent, CertificateInput, Session } from "./types";

/** Old browser-only store. Read only for the optional backup download; never deleted. */
export const LEGACY_LOCAL_KEYS = ["certichain.certificates.v1", "certichain.mock-registry.v1"];

type Row = Database["public"]["Tables"]["certificates"]["Row"];

export interface CertStoreState {
  ready: boolean;
  error?: string | undefined;
  certificates: Certificate[];
}

let state: CertStoreState = { ready: false, certificates: [] };
const SERVER_STATE: CertStoreState = { ready: false, certificates: [] };
const listeners = new Set<() => void>();
let loadedFor: string | null = null;

function emit(next: CertStoreState) {
  state = next;
  listeners.forEach((l) => l());
}

export function rowToCertificate(r: Row): Certificate {
  return {
    id: r.id,
    code: r.code,
    studentName: r.student_name,
    nim: r.nim,
    activity: r.activity,
    organizer: r.organizer,
    activityDate: r.activity_date,
    issueDate: r.issue_date,
    notes: r.notes ?? undefined,
    issuerId: r.issuer_id,
    issuerName: r.issuer_name,
    status: r.status === "REVOKED" ? "REVOKED" : "ACTIVE",
    revokedAt: r.revoked_at ?? undefined,
    revokeReason: r.revoke_reason ?? undefined,
    dataHash: r.data_hash,
    documentHash: r.document_hash ?? undefined,
    chainStatus: r.chain_status as Certificate["chainStatus"],
    chainMode: r.chain_mode === "evm" ? "evm" : "demo",
    chainReference: r.chain_reference ?? undefined,
    txHash: r.tx_hash ?? undefined,
    createdAt: r.created_at,
    events: (Array.isArray(r.events) ? r.events : []) as unknown as CertificateEvent[],
  };
}

async function computeDocumentHash(c: Certificate) {
  const { buildCertificatePdf } = await import("./pdf");
  return HashService.sha256Hex(await buildCertificatePdf(c));
}

function assertAdmin(session: Session | null) {
  if (session?.role !== "admin") throw new Error("Hanya admin yang berwenang melakukan aksi ini.");
}

async function fetchAll(): Promise<Certificate[]> {
  // Access rules decide which rows come back: admins see all, students only their own.
  const { data, error } = await supabase.from("certificates").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Gagal memuat sertifikat dari database.");
  return data.map(rowToCertificate);
}

async function patch(code: string, values: Database["public"]["Tables"]["certificates"]["Update"]) {
  const { data, error } = await supabase.from("certificates").update(values).eq("code", code).select().single();
  if (error) throw new Error("Gagal menyimpan perubahan ke database.");
  const cert = rowToCertificate(data);
  emit({ ...state, certificates: state.certificates.map((c) => (c.code === code ? cert : c)) });
  return cert;
}

export const CertificateService = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => SERVER_STATE,

  /** Load certificates visible to the signed-in user from the shared database. */
  async load(userId: string, force = false) {
    if (!force && loadedFor === userId && state.ready) return;
    loadedFor = userId;
    emit({ ready: false, certificates: state.certificates });
    try {
      emit({ ready: true, certificates: await fetchAll() });
    } catch (e) {
      emit({ ready: true, error: (e as Error).message, certificates: [] });
    }
  },
  clear() {
    loadedFor = null;
    emit({ ready: false, certificates: [] });
  },

  list: () => state.certificates,
  getByCode: (code: string) => state.certificates.find((c) => c.code === code.trim().toUpperCase()),

  async create(input: CertificateInput, session: Session | null): Promise<Certificate> {
    assertAdmin(session);
    const errors = validateCertificateInput(input);
    if (Object.keys(errors).length) throw new Error("Data sertifikat belum valid.");
    const year = Number(input.issueDate.slice(0, 4));
    // Read codes fresh from the database so other admins' certificates count.
    const { data: codes, error: codesErr } = await supabase.from("certificates").select("code").like("code", `CERT-${year}-%`);
    if (codesErr) throw new Error("Gagal membaca database.");
    const code = nextCertificateCode(codes.map((c) => c.code), year);
    const clean: CertificateInput = {
      studentName: input.studentName.trim(),
      nim: input.nim.trim().toUpperCase(),
      activity: input.activity.trim(),
      organizer: input.organizer.trim(),
      activityDate: input.activityDate,
      issueDate: input.issueDate,
      notes: input.notes?.trim() || undefined,
    };
    const dataHash = await HashService.hashCertificate({ ...clean, code, issuerId: DEFAULT_ISSUER.id });
    const now = new Date().toISOString();
    const draft: Certificate = {
      ...clean,
      id: "",
      code,
      issuerId: DEFAULT_ISSUER.id,
      issuerName: DEFAULT_ISSUER.name,
      status: "ACTIVE",
      dataHash,
      chainStatus: "PENDING",
      chainMode: blockchainService.mode,
      createdAt: now,
      events: [{ type: "ISSUED", at: now, actor: session!.name }],
    };
    const documentHash = await computeDocumentHash(draft);
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        code,
        student_name: clean.studentName,
        nim: clean.nim,
        activity: clean.activity,
        organizer: clean.organizer,
        activity_date: clean.activityDate,
        issue_date: clean.issueDate,
        notes: clean.notes ?? null,
        issuer_id: draft.issuerId,
        issuer_name: draft.issuerName,
        data_hash: dataHash,
        document_hash: documentHash,
        chain_status: "PENDING",
        chain_mode: draft.chainMode,
        created_at: now,
        created_by: session!.userId,
        events: draft.events as unknown as Row["events"],
      })
      .select()
      .single();
    if (error) throw new Error(error.code === "23505" ? "Kode sertifikat bentrok, coba lagi." : "Gagal menyimpan sertifikat ke database.");
    let cert = rowToCertificate(data);
    emit({ ...state, certificates: [cert, ...state.certificates] });

    try {
      const rec = await blockchainService.registerCertificate(code, dataHash, cert.issuerId);
      cert = await patch(code, {
        chain_status: rec.confirmed ? "CONFIRMED" : "SIMULATED",
        chain_reference: rec.reference,
        events: [...cert.events, { type: "CHAIN_REGISTERED", at: rec.registeredAt, actor: "Sistem", reference: rec.reference, note: rec.mode === "demo" ? "Pencatatan simulasi (mode demo)" : undefined }] as unknown as Row["events"],
      });
    } catch (e) {
      cert = await patch(code, {
        chain_status: "FAILED",
        events: [...cert.events, { type: "CHAIN_FAILED", at: new Date().toISOString(), actor: "Sistem", note: (e as Error).message }] as unknown as Row["events"],
      });
    }
    return cert;
  },

  async revoke(code: string, reason: string, session: Session | null) {
    assertAdmin(session);
    const cert = this.getByCode(code);
    if (!cert) throw new Error("Sertifikat tidak ditemukan.");
    if (cert.status === "REVOKED") throw new Error("Sertifikat sudah dicabut.");
    const r = reason.trim();
    if (r.length < 5) throw new Error("Alasan pencabutan minimal 5 karakter.");
    const now = new Date().toISOString();
    const events: CertificateEvent[] = [...cert.events, { type: "REVOKED", at: now, actor: session!.name, note: r }];
    if (cert.chainStatus === "SIMULATED" || cert.chainStatus === "CONFIRMED") {
      const rec = await blockchainService.revokeCertificate(code);
      events.push({ type: "CHAIN_REVOKED", at: rec.revokedAt ?? now, actor: "Sistem", note: rec.mode === "demo" ? "Status dicabut di registri simulasi" : undefined });
    }
    await patch(code, { status: "REVOKED", revoked_at: now, revoke_reason: r, events: events as unknown as Row["events"] });
  },
};
