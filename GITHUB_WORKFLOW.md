# 🚀 Panduan Workflow Git & GitHub — REHABTRACK

Dokumen ini berisi panduan standar operasional (SOP) untuk melakukan pembaharuan kode (update), branching, commit, dan sinkronisasi ke remote repository GitHub: **[singgihhamdani/adoptplant](https://github.com/singgihhamdani/adoptplant)**.

---

## 📌 Daftar Isi
1. [Ringkasan Perintah Cepat (Quick Commands)](#1-ringkasan-perintah-cepat-quick-commands)
2. [Checklist Sebelum Melakukan Update](#2-checklist-sebelum-melakukan-update)
3. [Standar Konvensi Pesan Commit (Conventional Commits)](#3-standar-konvensi-pesan-commit-conventional-commits)
4. [Langkah Demi Langkah Melakukan Update ke GitHub](#4-langkah-demi-langkah-melakukan-update-ke-github)
5. [Strategi Percabangan (Branching Strategy)](#5-strategi-percabangan-branching-strategy)
6. [Penanganan Masalah Umum (Troubleshooting)](#6-penanganan-masalah-umum-troubleshooting)

---

## 1. Ringkasan Perintah Cepat (Quick Commands)

Untuk melakukan update rutin perubahan lokal ke branch utama (`main`) di GitHub:

```bash
# 1. Cek status berkas yang dimodifikasi dan belum terlacak
git status

# 2. Tambahkan semua perubahan berkas yang relevan ke staging
git add .

# 3. Buat commit dengan pesan deskriptif sesuai konvensi
git commit -m "feat: <deskripsi fitur atau perbaikan>"

# 4. Ambil dan integrasikan pembaruan terkini dari remote (opsional jika bekerja tim)
git pull --rebase origin main

# 5. Dorong (push) commit ke repository GitHub
git push origin main
```

---

## 2. Checklist Sebelum Melakukan Update

Pastikan hal-hal berikut sudah terpenuhi sebelum melakukan `git push`:

| No | Komponen | Keterangan & Verifikasi |
|----|----------|-------------------------|
| 1 | **Keamanan & Rahasia (Secrets)** | Pastikan file `.env`, `.env.local`, API Keys, dan service account key (`*.json-key`, `*.pem`) **TIDAK** masuk ke staging git (sudah terdaftar di `.gitignore`). |
| 2 | **Frontend Build & TypeScript** | Jalankan `npm run build` di folder `frontend/` untuk memastikan tidak ada error TypeScript atau kompilasi Next.js. |
| 3 | **Dataset Besar (LFS / Storage)** | File GeoTIFF (`.tif`) atau zip besar dianjurkan untuk tidak di-push langsung jika ukurannya melebihi kuota standar GitHub (>50MB). |
| 4 | **Clean Pycache / Node Modules** | Pastikan folder `__pycache__` dan `node_modules/` tetap terabaikan sesuai aturan `.gitignore`. |

---

## 3. Standar Konvensi Pesan Commit (Conventional Commits)

Gunakan format standar: `<type>(<scope>): <deskripsi singkat>`

### Tipe Commit (`type`):
- `feat:` Penambahan fitur baru (misal: layer peta baru, sistem monitoring foto).
- `fix:` Perbaikan bug atau error sistem.
- `docs:` Perubahan atau penambahan dokumentasi (PRD, Technical Spec, README).
- `refactor:` Restrukturisasi kode tanpa mengubah fungsionalitas.
- `style:` Perubahan format kode, CSS/styling, whitespace tanpa perubahan logika.
- `chore:` Pembaruan dependensi, konfigurasi build, atau file tooling.
- `perf:` Optimasi performa (misal kompresi gambar client-side, indexing spatial).

### Contoh Pesan Commit:
```bash
git commit -m "feat(map): add banjarnegara disaster hazard and dasymetric impact layers"
git commit -m "feat(monitoring): implement offline-first field monitoring with client image compression"
git commit -m "docs: update GitHub workflow and architecture guidelines"
git commit -m "fix(auth): handle session expired redirect in Next.js middleware"
```

---

## 4. Langkah Demi Langkah Melakukan Update ke GitHub

### Langkah 1: Memeriksa Status Workspace
```bash
git status
```
*Periksa file mana saja yang berada pada status `modified`, `deleted`, atau `untracked`.*

### Langkah 2: Menambahkan Perubahan ke Staging Area
Untuk menambahkan semua perubahan sekaligus:
```bash
git add .
```
Atau jika ingin menambahkan modul spesifik secara bertahap:
```bash
# Contoh staging modul frontend
git add frontend/

# Contoh staging modul backend dan dokumentasi
git add backend/ docs/
```

### Langkah 3: Membuat Commit
```bash
git commit -m "feat: complete MVP-alpha modules (projects, plots, monitoring, map, and timeline)"
```

### Langkah 4: Sinkronisasi dengan Remote (Mencegah Konflik)
```bash
git fetch origin
git pull --rebase origin main
```

### Langkah 5: Mengirim ke GitHub (Push)
```bash
git push origin main
```

---

## 5. Strategi Percabangan (Branching Strategy)

Untuk kolaborasi tim dan pengembangan fitur besar, gunakan alur percabangan (feature branching):

```
main (Production / Stable MVP)
  │
  ├── feature/geotag-monitoring ───► PR ───► Merge to main
  ├── feature/gee-time-series   ───► PR ───► Merge to main
  └── fix/map-layer-projection  ───► PR ───► Merge to main
```

### Membuat dan Beralih ke Branch Baru:
```bash
# Buat branch baru untuk fitur
git checkout -b feature/nama-fitur

# Lakukan perubahan dan commit
git add .
git commit -m "feat: implement feature x"

# Push branch fitur ke GitHub
git push -u origin feature/nama-fitur
```

### Menggabungkan ke `main` via Pull Request (PR):
1. Buka repository di [GitHub - adoptplant](https://github.com/singgihhamdani/adoptplant).
2. Klik tombol **"Compare & pull request"**.
3. Berikan deskripsi perubahan dan minta review rekan tim.
4. Setelah disetujui, lakukan **"Merge pull request"**.

---

## 6. Penanganan Masalah Umum (Troubleshooting)

### A. Membatalkan Perubahan Lokal yang Belum Di-commit
```bash
# Membatalkan perubahan pada satu berkas
git restore <path/to/file>

# Membatalkan seluruh perubahan uncommitted
git restore .
```

### B. Membatalkan File yang Terlanjur di-`git add` (Unstaging)
```bash
git restore --staged <path/to/file>
```

### C. Mengubah Pesan Commit Terakhir yang Belum di-Push
```bash
git commit --amend -m "feat: pesan commit baru yang benar"
```

### D. Mengatasi Penolakan Push (Push Rejected - Non-Fast-Forward)
Jika ada commit baru di remote GitHub yang belum ada di lokal Anda:
```bash
# Ambil pembaruan terkini lalu susun ulang commit lokal di atasnya
git pull --rebase origin main

# Setelah konflik selesai, push kembali
git push origin main
```

### E. Memastikan Remote URL Benar
```bash
git remote -v
# Output yang diharapkan:
# origin  https://github.com/singgihhamdani/adoptplant.git (fetch)
# origin  https://github.com/singgihhamdani/adoptplant.git (push)
```

---

*Dokumen ini merupakan bagian dari standar repositori REHABTRACK.*
