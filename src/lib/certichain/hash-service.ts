import type { Certificate } from "./types";

type HashableFields = Pick<
  Certificate,
  "code" | "studentName" | "nim" | "activity" | "organizer" | "activityDate" | "issueDate" | "notes" | "issuerId"
>;

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const HashService = {
  async sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
    return toHex(digest);
  },

  /** Stable, ordered representation of the certificate document. */
  canonicalize(c: HashableFields): string {
    return JSON.stringify([
      ["code", c.code.trim()],
      ["issuerId", c.issuerId],
      ["studentName", c.studentName.trim()],
      ["nim", c.nim.trim()],
      ["activity", c.activity.trim()],
      ["organizer", c.organizer.trim()],
      ["activityDate", c.activityDate],
      ["issueDate", c.issueDate],
      ["notes", (c.notes ?? "").trim()],
    ]);
  },

  hashCertificate(c: HashableFields) {
    return this.sha256Hex(this.canonicalize(c));
  },

  async hashFile(file: Blob) {
    return this.sha256Hex(await file.arrayBuffer());
  },
};
