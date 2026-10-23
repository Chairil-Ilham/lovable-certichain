export function fmtDate(value?: string) {
  if (!value) return "-";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(new Date(value));
}

export function fmtDateTime(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function maskName(name: string) {
  return name
    .split(/\s+/)
    .map((w) => (w.length <= 1 ? w : w[0] + "*".repeat(w.length - 1)))
    .join(" ");
}

export function shortHash(h?: string, n = 10) {
  if (!h) return "-";
  return h.length <= n * 2 ? h : `${h.slice(0, n)}…${h.slice(-6)}`;
}

/**
 * Fixed public address used in QR codes and PDFs, so every device produces the
 * same PDF bytes (and hash) and the QR always opens the shared public site.
 */
export const PUBLIC_APP_URL = "https://true-credential-trail.lovable.app";

export function verificationUrl(code: string) {
  return `${PUBLIC_APP_URL}/verifikasi?kode=${encodeURIComponent(code)}`;
}
