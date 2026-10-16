import type { ChainMode } from "./types";

/** Only non-personal data is ever stored on-chain. */
export interface ChainRecord {
  certificateId: string; // certificate code, no personal data
  hash: string;
  issuerId: string;
  registeredAt: string;
  revoked: boolean;
  revokedAt?: string;
  /** Demo: simulation id. EVM: transaction hash. */
  reference: string;
  confirmed: boolean;
  mode: ChainMode;
}

export interface BlockchainService {
  readonly mode: ChainMode;
  readonly label: string;
  registerCertificate(certificateId: string, hash: string, issuerId: string): Promise<ChainRecord>;
  getCertificate(certificateId: string): Promise<ChainRecord | null>;
  revokeCertificate(certificateId: string): Promise<ChainRecord>;
  isCertificateValid(certificateId: string, hash: string): Promise<boolean>;
}

const REGISTRY_KEY = "certichain.mock-registry.v1";

function load(): Record<string, ChainRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function save(r: Record<string, ChainRecord>) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(r));
}
function simId() {
  const b = crypto.getRandomValues(new Uint8Array(4));
  return "SIMULASI-" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock registry that mimics the CertiChain smart contract API.
 * It never produces transaction hashes — only clearly-labelled simulation ids.
 */
class MockBlockchainService implements BlockchainService {
  readonly mode = "demo" as const;
  readonly label = "MODE DEMO — BELUM TERHUBUNG KE BLOCKCHAIN";
  /** Skip artificial latency (used when seeding demo data). */
  fast = false;

  async registerCertificate(certificateId: string, hash: string, issuerId: string) {
    if (!this.fast) await delay(400);
    const r = load();
    if (r[certificateId]) throw new Error("Sertifikat sudah tercatat di registri.");
    const rec: ChainRecord = {
      certificateId,
      hash,
      issuerId,
      registeredAt: new Date().toISOString(),
      revoked: false,
      reference: simId(),
      confirmed: false,
      mode: "demo",
    };
    r[certificateId] = rec;
    save(r);
    return rec;
  }
  async getCertificate(certificateId: string) {
    return load()[certificateId] ?? null;
  }
  async revokeCertificate(certificateId: string) {
    if (!this.fast) await delay(300);
    const r = load();
    const rec = r[certificateId];
    if (!rec) throw new Error("Sertifikat tidak ada di registri.");
    rec.revoked = true;
    rec.revokedAt = new Date().toISOString();
    save(r);
    return rec;
  }
  async isCertificateValid(certificateId: string, hash: string) {
    const rec = load()[certificateId];
    return !!rec && !rec.revoked && rec.hash === hash;
  }
  reset() {
    localStorage.removeItem(REGISTRY_KEY);
  }
}

export const mockBlockchain = new MockBlockchainService();

/** Swap this for an ethers.js-backed implementation to go live. */
export const blockchainService: BlockchainService = mockBlockchain;
