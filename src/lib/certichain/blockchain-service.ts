import { supabase } from "@/integrations/supabase/client";
import type { ChainMode } from "./types";

/** Only non-personal data is ever stored on-chain. */
export interface ChainRecord {
  certificateId: string; // certificate code, no personal data
  hash: string;
  issuerId: string;
  registeredAt: string;
  revoked: boolean;
  revokedAt?: string | undefined;
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

type Row = {
  certificate_code: string;
  hash: string;
  issuer_id: string;
  registered_at: string;
  revoked: boolean;
  revoked_at: string | null;
  reference: string;
  confirmed: boolean;
  mode: string;
};

export function toChainRecord(r: Row): ChainRecord {
  return {
    certificateId: r.certificate_code,
    hash: r.hash,
    issuerId: r.issuer_id,
    registeredAt: r.registered_at,
    revoked: r.revoked,
    revokedAt: r.revoked_at ?? undefined,
    reference: r.reference,
    confirmed: r.confirmed,
    mode: r.mode === "evm" ? "evm" : "demo",
  };
}

function simId() {
  const b = crypto.getRandomValues(new Uint8Array(4));
  return "SIMULASI-" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Simulated registry stored in the shared database (table chain_registry).
 * Mimics the CertiChain contract API. It never produces transaction hashes —
 * only clearly-labelled simulation ids — and sends nothing to any blockchain.
 */
class MockBlockchainService implements BlockchainService {
  readonly mode = "demo" as const;
  readonly label = "MODE DEMO — BELUM TERHUBUNG KE BLOCKCHAIN";

  async registerCertificate(certificateId: string, hash: string, issuerId: string) {
    const { data, error } = await supabase
      .from("chain_registry")
      .insert({ certificate_code: certificateId, hash, issuer_id: issuerId, reference: simId(), mode: "demo" })
      .select()
      .single();
    if (error) throw new Error(error.code === "23505" ? "Sertifikat sudah tercatat di registri." : "Gagal mencatat ke registri simulasi.");
    return toChainRecord(data);
  }
  async getCertificate(certificateId: string) {
    const { data, error } = await supabase.from("chain_registry").select("*").eq("certificate_code", certificateId).maybeSingle();
    if (error) throw new Error("Registri simulasi tidak dapat dibaca.");
    return data ? toChainRecord(data) : null;
  }
  async revokeCertificate(certificateId: string) {
    const { data, error } = await supabase
      .from("chain_registry")
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq("certificate_code", certificateId)
      .select()
      .maybeSingle();
    if (error || !data) throw new Error("Sertifikat tidak ada di registri.");
    return toChainRecord(data);
  }
  async isCertificateValid(certificateId: string, hash: string) {
    const rec = await this.getCertificate(certificateId);
    return !!rec && !rec.revoked && rec.hash === hash;
  }
}

export const mockBlockchain = new MockBlockchainService();

/** Swap this for an ethers.js-backed implementation to go live. */
export const blockchainService: BlockchainService = mockBlockchain;
