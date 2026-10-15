import type { Session } from "./types";

const KEY = "certichain.session.v1";

export const DEMO_STUDENTS = [
  { name: "Mahasiswa Demo A", nim: "DEMO-0001" },
  { name: "Mahasiswa Demo B", nim: "DEMO-0002" },
  { name: "Mahasiswa Demo C", nim: "DEMO-0003" },
];

let current: Session | null | undefined;
const listeners = new Set<() => void>();

function read(): Session | null {
  if (current !== undefined) return current;
  if (typeof window === "undefined") return null;
  try {
    current = JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    current = null;
  }
  return current ?? null;
}

export const SessionService = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: read,
  getServerSnapshot: () => null,
  signIn(s: Session) {
    current = s;
    localStorage.setItem(KEY, JSON.stringify(s));
    listeners.forEach((l) => l());
  },
  signOut() {
    current = null;
    localStorage.removeItem(KEY);
    listeners.forEach((l) => l());
  },
};
