import type { ChainMode, VerificationResult } from "./types";

export interface VerificationCheck {
  label: string;
  ok: boolean | null; // null = not checked
  detail: string;
}

/** Only fields safe to show publicly: masked name, no NIM, no internal data. */
export interface PublicCertificateView {
  code: string;
  holder: string;
  activity: string;
  organizer: string;
  issuerName: string;
  activityDate: string;
  issueDate: string;
  revokedAt?: string | undefined;
  revokeReason?: string | undefined;
  dataHash: string;
  chainReference?: string | undefined;
  chainMode: ChainMode;
}

export interface VerificationReport {
  query: string;
  result: VerificationResult;
  certificate?: PublicCertificateView;
  checks: VerificationCheck[];
  file?: { name: string; hash: string; matches: boolean } | undefined;
  checkedAt: string;
}
