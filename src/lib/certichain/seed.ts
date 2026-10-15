import type { CertificateInput } from "./types";

/** Fictional demo data — not real students. Replace with a database later. */
export const SEED_CERTIFICATES: { code: string; input: CertificateInput; register: boolean; revoke?: string }[] = [
  { code: "CERT-2026-0001", register: true, input: { studentName: "Mahasiswa Demo A", nim: "DEMO-0001", activity: "Seminar Nasional Literasi Digital", organizer: "BEM Fakultas Teknologi (Fiktif)", activityDate: "2026-05-08", issueDate: "2026-05-12" } },
  { code: "CERT-2026-0002", register: true, input: { studentName: "Mahasiswa Demo B", nim: "DEMO-0002", activity: "Workshop Desain UI/UX Dasar", organizer: "Himpunan Mahasiswa Informatika (Fiktif)", activityDate: "2026-05-20", issueDate: "2026-05-24" } },
  { code: "CERT-2026-0003", register: true, input: { studentName: "Mahasiswa Demo A", nim: "DEMO-0001", activity: "Bootcamp Pemrograman Web", organizer: "UKM Riset & Inovasi (Fiktif)", activityDate: "2026-06-10", issueDate: "2026-06-15", notes: "Peserta terbaik kategori proyek akhir." } },
  { code: "CERT-2026-0004", register: true, revoke: "Data kehadiran tidak memenuhi syarat minimum.", input: { studentName: "Mahasiswa Demo C", nim: "DEMO-0003", activity: "Pelatihan Kepemimpinan Mahasiswa", organizer: "BEM Universitas (Fiktif)", activityDate: "2026-07-02", issueDate: "2026-07-05" } },
  { code: "CERT-2026-0005", register: true, input: { studentName: "Mahasiswa Demo B", nim: "DEMO-0002", activity: "Webinar Keamanan Siber Dasar", organizer: "Himpunan Mahasiswa Informatika (Fiktif)", activityDate: "2026-07-18", issueDate: "2026-07-20" } },
  { code: "CERT-2026-0006", register: true, input: { studentName: "Mahasiswa Demo A", nim: "DEMO-0001", activity: "Lomba Karya Tulis Ilmiah Internal", organizer: "UKM Riset & Inovasi (Fiktif)", activityDate: "2026-08-14", issueDate: "2026-08-21", notes: "Juara 2." } },
  { code: "CERT-2026-0007", register: true, input: { studentName: "Mahasiswa Demo C", nim: "DEMO-0003", activity: "Kuliah Tamu Kewirausahaan", organizer: "Fakultas Ekonomi (Fiktif)", activityDate: "2026-09-03", issueDate: "2026-09-05" } },
  { code: "CERT-2026-0008", register: true, input: { studentName: "Mahasiswa Demo B", nim: "DEMO-0002", activity: "Lokakarya Penulisan Akademik", organizer: "Perpustakaan Pusat (Fiktif)", activityDate: "2026-09-22", issueDate: "2026-09-25" } },
  { code: "CERT-2026-0009", register: false, input: { studentName: "Mahasiswa Demo A", nim: "DEMO-0001", activity: "Pelatihan Analisis Data Dasar", organizer: "Laboratorium Komputasi (Fiktif)", activityDate: "2026-10-06", issueDate: "2026-10-09" } },
];
