import { describe, expect, it } from "vitest";
import { displayStatus, nextCertificateCode, validateCertificateInput } from "@/lib/certichain/rules";
import { HashService } from "@/lib/certichain/hash-service";

describe("CertiChain rules", () => {
  it("generates the next sequential code per year", () => {
    expect(nextCertificateCode(["CERT-2026-0001", "CERT-2026-0009", "CERT-2025-0042"], 2026)).toBe("CERT-2026-0010");
    expect(nextCertificateCode([], 2027)).toBe("CERT-2027-0001");
  });
  it("revoked certificates are REVOKED even if registered", () => {
    expect(displayStatus({ status: "REVOKED", chainStatus: "SIMULATED" })).toBe("REVOKED");
  });
  it("unregistered certificates are UNVERIFIED", () => {
    expect(displayStatus({ status: "ACTIVE", chainStatus: "NOT_REGISTERED" })).toBe("UNVERIFIED");
  });
  it("rejects issue date before activity date", () => {
    const e = validateCertificateInput({ studentName: "Demo X", nim: "DEMO-1", activity: "Seminar", organizer: "BEM", activityDate: "2026-05-10", issueDate: "2026-05-01" });
    expect(e.issueDate).toBeDefined();
  });
  it("hashes certificate data consistently", async () => {
    const c = { code: "CERT-2026-0001", studentName: "A B", nim: "N1", activity: "X", organizer: "Y", activityDate: "2026-01-01", issueDate: "2026-01-02", issuerId: "I" };
    expect(await HashService.hashCertificate(c)).toBe(await HashService.hashCertificate({ ...c }));
    expect(await HashService.hashCertificate(c)).not.toBe(await HashService.hashCertificate({ ...c, activity: "Z" }));
  });
});
