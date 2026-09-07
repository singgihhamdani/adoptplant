# 🌲 REHABTRACK — Platform Monitoring & Evaluasi Rehabilitasi Lahan

> **"Dari aksi penanaman menuju bukti pemulihan."**  
> *Platform monitoring & evaluasi rehabilitasi lahan berbasis spasial, Google Earth Engine (Sentinel-2 time series), geotagging lapangan, dan analisis dampak pengurangan risiko bencana berbasis ekosistem (Eco-DRR).*

---

## 📍 Wilayah Fokus Pilot
- **Wilayah:** Kabupaten Banjarnegara, Provinsi Jawa Tengah (Hulu Daerah Aliran Sungai Serayu).
- **Karakteristik:** Kawasan pegunungan berbukit rentan longsor & erosi, agroforestri kopi/sayur, serta hutan lindung & produksi.
- **Layer Data Spasial Lokal:**
  - 🏛️ **Batas Administrasi:** 20 Kecamatan & 278 Desa/Kelurahan resmi Kabupaten Banjarnegara.
  - 🗺️ **Pola Ruang / RTRW:** 14 Zonasi Tata Ruang resmi (Hutan Lindung, Hutan Produksi, Sempadan Sungai, dll).
  - ⚠️ **Kerawanan Bencana:** Peta Kelas Kerawanan Longsor, Banjir, dan 244 Titik Riwayat Longsor BPBD.
  - 👥 **Dampak Dasimetrik (Eco-DRR):** Estimasi populasi penduduk terpapar (*JML_JIWA*) yang terlindungi oleh aksi rehabilitasi.

---

## 🏛️ Arsitektur 3 Layer

```
+-----------------------------------------------------------------------------------+
|  LAYER 1: ACTION (Core)                                                           |
|  Projects • Plots • Polygons • Planting Events • Geotagging • Interventions       |
+-----------------------------------------------------------------------------------+
|  LAYER 2: EVIDENCE (Core)                                                         |
|  Field Monitoring • Sentinel-2 GEE • NDVI/EVI Time Series • Recovery Evaluation   |
+-----------------------------------------------------------------------------------+
|  LAYER 3: ENGAGEMENT (Supporting)                                                 |
|  Adopt a Plot • Forest Journal • Public Transparency • Impact Metrics             |
+-----------------------------------------------------------------------------------+
```

---

## ✨ Fitur-Fitur Utama

### 1. 🗺️ GIS Map Explorer & Analisis Kontekstual (`/map`)
- Visualisasi interaktif Leaflet SVG Engine dengan *Layer & Analisis Floating HUD*.
- Deteksi instan titik klik: Desa, Kecamatan, Pola Ruang (RTRW), status kerawanan longsor/banjir, estimasi jiwa terpapar, dan riwayat BPBD terdekat.
- Tombol **`+ Daftarkan Plot di Sini`** untuk alur kerja terpadu.

### 2. 🎯 Pulsing Target Beacon (Efek Radar Navigasi Spasial)
- Hand-off navigasi instan dari peta eksplorasi ke formulir pendaftaran plot baru.
- Peta otomatis *auto-center*, *zoom-in*, dan menampilkan **animasi radar hijau berdenyut** di titik target pilihan.
- Form otomatis mengidentifikasi desa, legalitas zonasi, dan menyarankan nama plot.

### 3. 📐 Pendaftaran Plot & Poligon Spasial (`/plots/new`)
- **GIS Polygon Drawer:** Menggambar batas poligon lahan dengan akurasi tinggi.
- **Mode Layar Penuh (*Fullscreen GIS*):** Kanvas seluas 100vw × 100vh untuk digitasi batas plot tanpa hambatan.
- **Kalkulasi Otomatis:** Menghitung luas akurat dalam Hektar (Ha) dan meter persegi (m²).
- **Auto-Insight Eco-DRR:** Tombol `+ Terapkan Insight Spasial` untuk menyalin hasil analisis zonasi dan estimasi jiwa terlindungi ke deskripsi baseline dengan 1-klik.

### 4. 🛰️ FastAPI Remote Sensing Backend & GEE Engine (`/backend`)
- Ekstraksi citra satelit **Sentinel-2 MSI Level-2A** (*COPERNICUS/S2_SR_HARMONIZED*) resolusi 10m/pixel.
- **Cloud Masking Tropis:** Menggunakan kombinasi `QA60` dan `SCL` (*Scene Classification Layer*) untuk memfilter tutupan awan pegunungan.
- **Indeks Vegetasi Multi-Spektral:**
  - **NDVI** (*Normalized Difference Vegetation Index*)
  - **EVI** (*Enhanced Vegetation Index*)
  - **NDMI** (*Normalized Difference Moisture Index*)
- **Evaluasi Pemulihan Otomatis:** Status plot (`RECOVERING`, `MONITORING`, `AT_RISK`) dan *Rehabilitation Recovery Score (0–100)*.

### 5. 📱 Field Monitoring & Dokumentasi Lapangan (`/monitoring/new`)
- Pengambilan titik koordinat GPS lapangan dengan *accuracy threshold* dan deteksi spatial containment di dalam poligon plot.
- Pencatatan jumlah pohon sehat, stres, mati, dan hilang dengan kalkulasi otomatis *Survival Rate (%)*.
- Kompresi foto otomatis di sisi client (Canvas API $\le 800$ KB) sebelum diunggah ke storage.

---

## 🛠️ Stack Teknologi

| Komponen | Teknologi |
|---|---|
| **Frontend** | Next.js 16 (App Router), React, TypeScript, TanStack Query |
| **Peta & GIS** | Leaflet, MapLibre GL JS, GeoJSON Engine |
| **Backend & Analytics** | FastAPI (Python 3.11+), Google Earth Engine Python API (`earthengine-api`) |
| **Database & Auth** | Supabase (PostgreSQL + PostGIS, Supabase Auth, Row Level Security) |
| **Grafik & Visualisasi** | Recharts, Lucide React Icons |

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
- Node.js v18+ atau v20+
- Python 3.10+ atau 3.11+
- Git

---

### 2. Menjalankan Frontend (Next.js)

1. Masuk ke direktori `frontend`:
   ```bash
   cd u:\Project\adoptplan\frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Pastikan file `frontend/.env.local` telah terkonfigurasi:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://cwpbfrnlxibrrpkmaepc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
4. Jalankan server development:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di: **[http://localhost:3000](http://localhost:3000)**

---

### 3. Menjalankan Backend Remote Sensing (FastAPI)

1. Masuk ke direktori `backend`:
   ```bash
   cd u:\Project\adoptplan\backend
   ```
2. Buat virtual environment (opsional namun disarankan):
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   ```
3. Instal dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```
4. Kredensial Google Earth Engine telah tersedia di `backend/gee-key.json` dan `backend/.env`.
5. Jalankan server FastAPI:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Dokumentasi interaktif Swagger API: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 📖 Panduan Penggunaan Aplikasi (Alur Kerja)

### 🔐 Tahap 1: Pendaftaran & Masuk Akun
1. Buka `http://localhost:3000/register`.
2. Masukkan **Nama Lengkap / Instansi**, **Email**, **Password** (min. 6 karakter), dan konfirmasi **Ulangi Password**.
3. Klik ikon 👁️ (*mata*) untuk melihat/menyembunyikan kata sandi.
4. Klik **"Daftar Sekarang"** lalu login di `http://localhost:3000/login`.

---

### 🗺️ Tahap 2: Eksplorasi Wilayah Kritis di Peta Spasial
1. Buka menu **Peta Spasial** (`/map`).
2. Gunakan menu melayang **`[ 🥞 Layer & Analisis ]`** di pojok kanan atas untuk mengaktifkan:
   - *Batas 20 Kecamatan & 278 Desa*
   - *Pola Ruang (RTRW 14 Zonasi)*
   - *Bahaya Longsor & Jiwa Terpapar*
   - *Riwayat Longsor BPBD (244 Titik)*
3. Klik salah satu lokasi yang berstatus kerawanan tinggi (misal: *Desa Pananggungan, Kec. Wanayasa*).
4. Klik tombol hijau **`+ Daftarkan Plot di Sini`**.

---

### 🌲 Tahap 3: Pembuatan Proyek & Plot Baru
1. Sistem akan mengarahkan Anda ke formulir pendaftaran plot dengan **Pulsing Radar Beacon** yang berdenyut di lokasi yang dipilih.
2. Klik tombol **`[ ⛶ Layar Penuh ]`** jika ingin menggambar dengan kanvas seluas layar monitor.
3. Klik minimal 3 titik sudut untuk membentuk poligon batas lahan plot.
4. Luas Hektar (Ha) akan terhitung secara otomatis.
5. Periksa kartu **Hasil Analisis Kontekstual & Estimasi Dampak Eco-DRR**, lalu klik **`+ Terapkan Insight Spasial`** untuk menyalin analisis ke deskripsi.
6. Masukkan nama plot dan target bibit, lalu klik **"Simpan Plot & Poligon"**.

---

### 🛰️ Tahap 4: Analisis Citra Satelit Sentinel-2
1. Buka halaman detail plot yang telah dibuat (`/plots/[id]`).
2. Masuk ke tab **"Citra Satelit (Sentinel-2)"**.
3. Klik tombol **`⚡ Jalankan Analisis Satelit GEE`**.
4. Sistem backend FastAPI akan memproses data citra satelit Sentinel-2 melalui Google Earth Engine API dan menyajikan kurva time series NDVI & EVI beserta status pemulihan (*Recovery Score*).

---

### 📋 Tahap 5: Input Monitoring Lapangan
1. Buka menu **Field Monitoring** $\rightarrow$ **Input Monitoring Baru** (`/monitoring/new`).
2. Pilih plot yang dituju dan klik **"Ambil Lokasi GPS Saya"**.
3. Masukkan jumlah tanaman sehat, merana, mati, dan tinggi rata-rata tanaman.
4. Unggah foto bukti monitoring lapangan (foto otomatis dikompresi).
5. Klik **"Simpan Data Monitoring"**. Data lapangan akan otomatis disandingkan dengan kurva tren satelit.

---

## 📁 Struktur Direktori Proyek

```
adoptplan/
├── README.md                           # ← Panduan Lengkap Aplikasi (File ini)
├── AGENTS.md                           # Aturan Konsistensi & Panduan AI
├── data/
│   ├── boundary/                       # GeoJSON Batas 20 Kecamatan & 278 Desa Banjarnegara
│   ├── thematic/                       # GeoJSON Pola Ruang, Dasimetrik Longsor/Banjir, BPBD
│   └── riset-banjarnegara-*.json       # Kunci Service Account Google Cloud
├── frontend/                           # Aplikasi Next.js 16 App Router (TypeScript)
│   ├── public/data/                    # Layer GeoJSON publik untuk Leaflet
│   └── src/
│       ├── app/                        # Halaman Dashboard, Map, Plots, Projects, Monitoring
│       ├── components/                 # UI Components, GIS Drawer, Layer Control, Charts
│       ├── hooks/                      # TanStack React Query Hooks
│       └── lib/                        # Supabase Client, Spatial Inspector, Map Config
├── backend/                            # FastAPI Remote Sensing Service (Python 3.11+)
│   ├── gee-key.json                    # Google Earth Engine Service Account Key
│   ├── app/
│   │   ├── core/                       # Config & Security
│   │   ├── routers/                    # Endpoint Satellite, Analytics, Health
│   │   └── services/                   # GEE Engine (Sentinel-2 NDVI/EVI) & Supabase Service
│   └── requirements.txt                # Dependensi Python
└── supabase/                           # PostgreSQL + PostGIS Schema & Migrasi
```

---

## 📄 Lisensi & Hak Cipta
Dikembangkan untuk program **Restorasi dan Rehabilitasi Lahan Kritis Kabupaten Banjarnegara (Eco-DRR Platform)**.  
*Hak Cipta © 2026 REHABTRACK — All Rights Reserved.*
