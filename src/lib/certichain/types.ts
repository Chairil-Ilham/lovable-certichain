export type CertificateStatus = "ACTIVE" | "REVOKED";
export type DisplayStatus = "VALID" | "REVOKED" | "UNVERIFIED";
export type VerificationResult = DisplayStatus | "NOT_FOUND";
export type ChainStatus = "NOT_REGISTERED" | "PENDING" | "SIMULATED" | "CONFIRMED" | "FAILED";
export type ChainMode = "demo" | "evm";

export interface CertificateEvent {
  type: "ISSUED" | "CHAIN_REGISTERED" | "CHAIN_FAILED" | "REVOKED" | "CHAIN_REVOKED";
  at: string;
  actor: string;
  note?: string | undefined;
  reference?: string | undefined;
}

export interface CertificateInput {
  studentName: string;
  nim: string;
  activity: string;
  organizer: string;
  activityDate: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD
  notes?: string | undefined;
}

export interface Certificate extends CertificateInput {
  id: string;
  code: string;
  issuerId: string;
  issuerName: string;
  status: CertificateStatus;
  revokedAt?: string | undefined;
  revokeReason?: string | undefined;
  dataHash: string;
  documentHash?: string | undefined;
  chainStatus: ChainStatus;
  chainMode: ChainMode;
  /** Demo mode: simulation reference (NOT a transaction hash). */
  chainReference?: string | undefined;
  /** Only set when a real EVM transaction is confirmed. */
  txHash?: string | undefined;
  createdAt: string;
  events: CertificateEvent[];
}

export interface Issuer {
  id: string;
  name: string;
}

export type Session =
  | { role: "admin"; name: string }
  | { role: "student"; name: string; nim: string };
