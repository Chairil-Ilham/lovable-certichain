import { blockchainService, mockBlockchain } from "./blockchain-service";
import { HashService } from "./hash-service";
import { DEFAULT_ISSUER, nextCertificateCode, validateCertificateInput } from "./rules";
import { SEED_CERTIFICATES } from "./seed";
import type { Certificate, CertificateInput, Session } from "./types";

const KEY = "certichain.certificates.v1";

export interface CertStoreState {
  ready: boolean;
  certificates: Certificate[];
}

let state: CertStoreState = { ready: false, certificates: [] };
const SERVER_STATE: CertStoreState = { ready: false, certificates: [] };
const listeners = new Set<() => void>();
let initPromise: Promise<void> | null = null;

function set(certificates: Certificate[], ready = true) {
  state = { ready, certificates };
  localStorage.setItem(KEY, JSON.stringify(certificates));
  listeners.forEach((l) => l());
}
function update(code: string, fn: (c: Certificate) => Certificate) {
  set(state.certificates.map((c) => (c.code === code ? fn(c) : c)));
}

async function computeDocumentHash(c: Certificate) {
  const { buildCertificatePdf } = await import("./pdf");
  return HashService.sha256Hex(await buildCertificatePdf(c));
}

async function seed(): Promise<Certificate[]> {
  mockBlockchain.reset();
  const out: Certificate[] = [];
  for (const s of SEED_CERTIFICATES) {
    const base = { ...s.input, code: s.code, issuerId: DEFAULT_ISSUER.id };
    const dataHash = await HashService.hashCertificate(base);
    const createdAt = `${s.input.issueDate}T03:00:00.000Z`;
    const cert: Certificate = {
      ...s.input,
      id: crypto.randomUUID(),
      code: s.code,
      issuerId: DEFAULT_ISSUER.id,
      issuerName: DEFAULT_ISSUER.name,
      status: "ACTIVE",
      dataHash,
      chainStatus: "NOT_REGISTERED",
      chainMode: blockchainService.mode,
      createdAt,
      events: [{ type: "ISSUED", at: createdAt, actor: "Admin Demo" }],
    };
    if (s.register) {
      const rec = await blockchainService.registerCertificate(cert.code, dataHash, cert.issuerId);
      cert.chainStatus = rec.confirmed ? "CONFIRMED" : "SIMULATED";
      cert.chainReference = rec.reference;
      cert.events.push({ type: "CHAIN_REGISTERED", at: createdAt, actor: "Sistem", reference: rec.reference, note: "Pencatatan simulasi (mode demo)" });
    }
    if (s.revoke) {
      await blockchainService.revokeCertificate(cert.code);
      cert.status = "REVOKED";
      cert.revokedAt = new Date().toISOString();
      cert.revokeReason = s.revoke;
      cert.events.push({ type: "REVOKED", at: cert.revokedAt, actor: "Admin Demo", note: s.revoke });
    }
    out.push(cert);
  }
  return out;
}

function assertAdmin(session: Session | null) {
  if (session?.role !== "admin") throw new Error("Hanya admin yang berwenang melakukan aksi ini.");
}

export const CertificateService = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => SERVER_STATE,

  init() {
    if (typeof window === "undefined") return Promise.resolve();
    initPromise ??= (async () => {
      let list: Certificate[] | null = null;
      try {
        list = JSON.parse(localStorage.getItem(KEY) ?? "null");
      } catch {
        list = null;
      }
      if (!list || !Array.isArray(list)) list = await seed();
      set(list);
      // Fill missing document hashes (PDF bytes) in the background.
      for (const c of list.filter((x) => !x.documentHash)) {
        const h = await computeDocumentHash(c);
        update(c.code, (x) => ({ ...x, documentHash: h }));
      }
    })();
    return initPromise;
  },

  async resetDemo() {
    localStorage.removeItem(KEY);
    initPromise = null;
    state = { ready: false, certificates: [] };
    listeners.forEach((l) => l());
    await this.init();
  },

  list: () => state.certificates,
  getByCode: (code: string) => state.certificates.find((c) => c.code === code.trim().toUpperCase()),
  findByDocumentHash: (h: string) => state.certificates.find((c) => c.documentHash === h),

  async create(input: CertificateInput, session: Session | null): Promise<Certificate> {
    assertAdmin(session);
    await this.init();
    const errors = validateCertificateInput(input);
    if (Object.keys(errors).length) throw new Error("Data sertifikat belum valid.");
    const year = Number(input.issueDate.slice(0, 4));
    const code = nextCertificateCode(state.certificates.map((c) => c.code), year);
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
    let cert: Certificate = {
      ...clean,
      id: crypto.randomUUID(),
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
    cert.documentHash = await computeDocumentHash(cert);
    set([cert, ...state.certificates]);

    try {
      const rec = await blockchainService.registerCertificate(code, dataHash, cert.issuerId);
      cert = {
        ...cert,
        chainStatus: rec.confirmed ? "CONFIRMED" : "SIMULATED",
        chainReference: rec.reference,
        events: [...cert.events, { type: "CHAIN_REGISTERED", at: rec.registeredAt, actor: "Sistem", reference: rec.reference, note: rec.mode === "demo" ? "Pencatatan simulasi (mode demo)" : undefined }],
      };
    } catch (e) {
      cert = { ...cert, chainStatus: "FAILED", events: [...cert.events, { type: "CHAIN_FAILED", at: new Date().toISOString(), actor: "Sistem", note: (e as Error).message }] };
    }
    update(code, () => cert);
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
    const events = [...cert.events, { type: "REVOKED" as const, at: now, actor: session!.name, note: r }];
    if (cert.chainStatus === "SIMULATED" || cert.chainStatus === "CONFIRMED") {
      const rec = await blockchainService.revokeCertificate(code);
      events.push({ type: "CHAIN_REVOKED", at: rec.revokedAt ?? now, actor: "Sistem", note: rec.mode === "demo" ? "Status dicabut di registri simulasi" : undefined });
    }
    update(code, (c) => ({ ...c, status: "REVOKED", revokedAt: now, revokeReason: r, events }));
  },
};
