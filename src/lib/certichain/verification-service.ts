import { HashService } from "./hash-service";
import { verifyCertificateFn } from "./verification.functions";
import type { VerificationReport } from "./verification-types";

export type { PublicCertificateView, VerificationCheck, VerificationReport } from "./verification-types";

/** Client wrapper: all checks run on the server against the shared database. */
export const VerificationService = {
  async verifyByCode(rawCode: string, file?: File): Promise<VerificationReport> {
    const fileHash = file ? await HashService.hashFile(file) : undefined;
    return verifyCertificateFn({ data: { code: rawCode, fileHash, fileName: file?.name } });
  },
  async verifyFile(file: File, code?: string): Promise<VerificationReport> {
    return this.verifyByCode(code ?? "", file);
  },
};
