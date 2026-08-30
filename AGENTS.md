# REHABTRACK — Panduan AI & Aturan Konsistensi Proyek

> Dokumen ini di-load otomatis oleh AI di setiap sesi.
> Tujuan: menjaga konsistensi arsitektur, terminologi, fokus wilayah, dan keputusan desain di seluruh percakapan.

---

## 1. Identitas Produk & Fokus Wilayah

- **Nama resmi:** REHABTRACK
- **Tagline:** "Dari aksi penanaman menuju bukti pemulihan."
- **Deskripsi singkat:** Platform monitoring & evaluasi rehabilitasi lahan berbasis geotagging, Google Earth Engine, time series, dan community engagement.
- **Bahasa interface:** Bahasa Indonesia (primary), English (secondary/future)
- **North Star Metric:** Jumlah plot rehabilitasi yang memiliki bukti monitoring temporal dan dapat menunjukkan status pemulihan yang dapat ditindaklanjuti.

### 📍 Fokus Wilayah Pilot (Tahap Awal):
- **Wilayah Fokus:** **Kabupaten Banjarnegara, Provinsi Jawa Tengah**
- **Karakteristik Wilayah:** Wilayah hulu Daerah Aliran Sungai (DAS) Serayu, kawasan perbukitan/pegunungan rentan erosi & longsor, agroforestri kopi/sayur, dan hutan lindung/rakyat.
- **Pusat Koordinat Default Spasial:** Latitude `-7.397`, Longitude `109.698`, Zoom Level: `11` (BBox: Lon `109.45` s/d `109.95`, Lat `-7.55` s/d `-7.20`).
- **Data Batas Administrasi & Layer Kontekstual Spasial Lokal:**
  1. Batas Administrasi (`data/map/BOUNDARY/`): `Administrasi Kecamatan.geojson` (20 Kec) & `Administrasi Desa.geojson` (278 Desa).
  2. Pola Ruang / RTRW (`data/map/POLA RUANG V2/`): 14 zonasi tata ruang resmi (Hutan Lindung, Produksi, Sempadan Sungai, dll).
  3. Kerawanan & Riwayat Bencana (`data/map/KELAS DAN INDEKS BENCANA/`): Peta Kerawanan Longsor/Banjir & 244 Titik Riwayat Longsor BPBD.
  4. Dampak Bencana Dasimetrik (`data/databaru/dataimpact/`): `kelas Longsor.geojson` & `kelas Banjir.geojson` — Estimasi populasi penduduk terpapar (`JML_JIWA`) untuk analisis dampak pengurangan risiko bencana berbasis ekosistem (*Eco-DRR*).
- **Aturan Layer Kontekstual:**
  - Layer administrasi dan tematik kebencanaan/pola ruang digunakan sebagai **overlay referensi kontekstual spasial on-demand** pada engine peta Leaflet / MapLibre.
  - Membantu petugas lapangan dan manajer proyek memprioritaskan penanaman di lereng kritis berisiko tinggi dan menghitung dampak perlindungan penduduk sekitar.

---

## 2. Arsitektur & Layer Produk

REHABTRACK terdiri dari 3 layer. **Selalu hormati pemisahan ini:**

| Layer | Nama | Fungsi | Prioritas |
|-------|------|--------|-----------|
| 1 | **ACTION** | Project, Plot, Planting, Geotagging, Intervention | Core — MVP-α |
| 2 | **EVIDENCE** | Field Monitoring, GEE/Satellite, Time Series, Evaluation | Core — MVP-β |
| 3 | **ENGAGEMENT** | Adopt a Plot, Forest Journal, Impact Report, Funding | Supporting — Post-MVP |

### Aturan:
- Layer 1 dan 2 adalah **core engine**. Jangan pernah mencampur logika engagement (Layer 3) ke dalam core.
- Layer 3 **tidak boleh** menjadi dependency dari Layer 1 atau 2.
- Setiap fitur baru harus bisa ditempatkan di salah satu layer. Jika tidak bisa, pertanyakan apakah fitur tersebut masuk scope.

---

## 3. Terminologi Domain — WAJIB KONSISTEN

Gunakan istilah-istilah ini secara konsisten di seluruh codebase, UI, API, dan dokumentasi:

| Istilah | Definisi | ❌ Jangan Gunakan |
|---------|----------|-------------------|
| **Project** | Program rehabilitasi secara keseluruhan (e.g. "Restorasi DAS Serayu Hulu") | Program, Campaign |
| **Plot** | Bagian geografis dari sebuah project yang dimonitor. Memiliki polygon boundary. | Area, Zone, Site (kecuali dalam konteks umum) |
| **Planting Event** | Aktivitas penanaman pada tanggal tertentu di sebuah plot | Planting Record, Tree Entry |
| **Field Monitoring** | Kegiatan pengamatan langsung di lapangan oleh petugas | Survey, Inspection, Check |
| **Intervention** | Tindakan setelah penanaman: penyulaman, pemeliharaan, pengendalian gangguan | Action, Activity (terlalu generic) |
| **Baseline** | Kondisi lahan sebelum atau pada awal program rehabilitasi | Initial State |
| **Satellite Observation** | Hasil analisis data penginderaan jauh pada periode tertentu | Remote Sensing Data, GEE Data |
| **Time Series** | Rangkaian nilai indikator yang dikumpulkan secara temporal | Trend, History (terlalu generic) |
| **Adopt a Plot** | Mekanisme engagement untuk mendukung sebuah plot dan mengikuti perkembangannya | Donate, Sponsor (belum ada payment) |
| **Rehabilitation Recovery** | Perubahan positif kondisi vegetasi/lahan dari gabungan bukti lapangan dan remote sensing | Success, Growth |
| **Forest Journal** | Update naratif tentang progres project/plot untuk publik | Blog, News, Update (terlalu generic) |
| **Rehabilitation Score** | Skor transparan berbasis komponen yang menilai pemulihan (Phase 2+) | AI Score, Rating |
| **Reference Area / Control Area** | Area tanpa intervensi rehabilitasi yang digunakan sebagai pembanding | Benchmark |

### Kondisi Tanaman (Enum):
```
HEALTHY | STRESSED | DEAD | MISSING | UNKNOWN
```

### Status Plot (Enum):
```
RECOVERING (green) | MONITORING (yellow) | AT_RISK (red)
```

### Jenis Intervention (Enum):
```
PLANTING | REPLANTING | MAINTENANCE | FERTILIZATION | WATERING | PEST_CONTROL | OTHER
```

### Jenis Rehabilitasi (Enum):
```
REFORESTATION | AGROFORESTRY | MANGROVE_RESTORATION | RIPARIAN_RESTORATION | MINE_RECLAMATION | WATERSHED_REHABILITATION | OTHER
```

---

## 4. Prinsip Desain Produk — SELALU PATUHI

1. **Evidence over Activity** — Fokus pada bukti pemulihan, bukan jumlah aktivitas.
2. **Map First, Data Second** — Lokasi adalah konteks utama. Setiap tampilan data harus memiliki konteks spasial.
3. **Time Matters** — Perubahan dari waktu ke waktu lebih penting daripada snapshot.
4. **Field + Satellite** — Tidak mengandalkan satu sumber data. Keduanya saling melengkapi.
5. **Simple Field Workflow** — Petugas lapangan harus dapat mengisi data dengan cepat, bahkan offline.
6. **Transparent Impact** — Kontribusi publik harus dikaitkan dengan proyek/plot dan perkembangan nyata.
7. **Explainable Analytics** — Setiap kesimpulan harus memiliki indikator yang dapat dijelaskan. Tidak ada "angka AI" yang tidak transparan.

---

## 5. Batasan Teknis — GEE & Remote Sensing

### WAJIB diingat:
- **GEE mengamati pada level area/pixel, BUKAN individu pohon.**
- **NDVI tidak bisa membuktikan satu pohon hidup atau mati.**
- Data GEE dan data lapangan adalah **sumber bukti yang saling melengkapi**, bukan pengganti satu sama lain.
- Wilayah pegunungan Banjarnegara dan sekitarnya memiliki **tutupan awan tinggi**. Cloud masking (QA60/SCL) dan strategi composite (Sentinel-2 bulanan/musiman) adalah keharusan.
- Sentinel-2 = 10m/pixel. Plot kecil (<500m²) menghasilkan beberapa pixel; interpretasi spasial harus berhati-hati.

### Dataset Utama:
- **Sentinel-2** (10m) — NDVI, EVI, visual composite
- **Landsat 8/9** (30m) — time series jangka panjang, NDVI, NBR
- **Dynamic World** — land cover classification
- **Hansen Global Forest Change** — tree cover, forest loss/gain

### Indikator MVP:
| Indikator | Sumber | Tujuan |
|-----------|--------|--------|
| NDVI | Sentinel-2 | Kondisi/kepadatan vegetasi |
| EVI | Sentinel-2 | Indikator tambahan vegetasi |
| Land Cover | Dynamic World | Perubahan kelas tutupan lahan |

---

## 6. Arsitektur Teknis

### Stack Teknologi:
| Komponen | Teknologi | Catatan |
|----------|-----------|---------|
| Frontend | Next.js (App Router) + React | TypeScript wajib |
| Database & Backend Core | Supabase (Cloud, Singapore `ap-southeast-1`) | Managed PostgreSQL + PostGIS, Supabase Auth, Storage, Realtime, RLS |
| Analytics & GEE Engine | FastAPI (Python 3.11+) | Async-first, GEE Python API, Celery + Redis for async tasks |
| Remote Sensing | Google Earth Engine (Python API) | Via FastAPI backend, bukan client-side |
| Map Engine | Leaflet & MapLibre GL JS | Open-source SVG vector & raster tile, custom polygon layers |
| Data Administrasi | GeoJSON (`data/map/BOUNDARY/`) | Batas Kecamatan & Batas Desa Banjarnegara |
| Object Storage | Supabase Storage | Bucket `monitoring-photos` untuk foto terkompresi |
| Auth & Security | Supabase Auth + RLS Policies | Email/password, Row Level Security di database level |
| Mobile | PWA (Next.js) | Offline-first wajib (IndexedDB via Dexie.js) |

### Aturan Arsitektur:
1. **Hybrid Architecture** — Operasi CRUD standar, Auth, Storage, dan Realtime ditangani langsung via Supabase SDK di client dengan RLS. Operasi berat seperti GEE remote sensing analysis, Celery tasks, and file exports ditangani oleh FastAPI service.
2. **Modular** — GEE engine di backend harus bisa diganti/diperluas tanpa mengubah core.
3. **Database-level Security (RLS)** — Seluruh akses data diamankan via Supabase Row Level Security policies.
4. **Offline-first untuk mobile** — Data monitoring disimpan lokal di IndexedDB, sync ke Supabase saat ada koneksi.
5. **Spatial-first** — Semua entity yang memiliki lokasi harus menggunakan PostGIS geometry (SRID 4326).

---

## 7. Konvensi Kode

### Naming:
- **Files:** `snake_case` (Python), `kebab-case` (TypeScript/components)
- **Variables/Functions:** `snake_case` (Python), `camelCase` (TypeScript)
- **Classes/Types:** `PascalCase`
- **Database tables:** `snake_case`, plural (e.g., `field_monitorings`)
- **API endpoints:** `kebab-case`, plural (e.g., `/api/v1/field-monitorings`)
- **Enum values:** `UPPER_SNAKE_CASE`

---

## 8. Data Validation Rules

### GPS/Koordinat:
- Accuracy threshold: **≤ 50 meter** untuk monitoring, **≤ 20 meter** untuk planting
- Koordinat monitoring **harus berada di dalam polygon plot** (spatial containment check)
- Koordinat di Indonesia (fokus Banjarnegara): lat `-7.6` s/d `-7.1`, lon `109.3` s/d `110.1`

### Foto:
- EXIF metadata harus dipreservasi (timestamp, GPS jika ada)
- Mandatory untuk setiap field monitoring
- **Kompresi client-side otomatis sebelum upload (maksimal 800 KB per foto)** via HTML Canvas API
- Minimum 1 foto, maksimum 10 foto per monitoring

### Data Entry:
- `survival_rate` = `healthy_count / (healthy_count + stressed_count + dead_count + missing_count)` — auto-calculated
- `healthy_count + stressed_count + dead_count + missing_count ≤ total_planted`
- `avg_height` dan `avg_diameter` harus > 0 jika diisi
- Tanggal monitoring tidak boleh sebelum tanggal penanaman plot

---

## 9. File & Folder Structure

```
adoptplan/
├── AGENTS.md                           # ← Panduan AI & Aturan Konsistensi (File ini)
├── data/
│   └── map/
│       └── BOUNDARY/
│           ├── Administrasi Kecamatan.geojson   # Batas 20 Kecamatan Banjarnegara
│           └── Administrasi Desa.geojson        # Batas 278 Desa Banjarnegara
├── docs/
│   ├── PRD_REHABTRACK_v0.2.md         # Product Requirements Document
│   ├── DATA_MODEL.md                   # Entity & relationship definitions
│   ├── TECHNICAL_SPEC.md              # GEE, offline, security, validation specs
│   └── MVP_SCOPE.md                   # MVP-α dan MVP-β scope & timeline
├── frontend/                           # Next.js 14 App Router (TypeScript)
│   ├── public/
│   │   └── data/                      # Static GeoJSON map layers
│   └── src/
│       ├── app/                       # Dashboard, plots, monitoring, timeline, map
│       ├── components/                # UI, MapLibre, Monitoring, Timeline components
│       ├── hooks/                     # React Query data hooks
│       └── lib/                       # Supabase client, image compression, utils
├── backend/                            # FastAPI app (Python 3.11+)
│   ├── app/                           # Routers, services, GEE engine, workers
│   └── gee/                           # Google Earth Engine extraction scripts
└── supabase/                           # PostgreSQL + PostGIS schemas & migrations
```

---

## 10. Referensi Dokumen

Saat bekerja pada fitur tertentu, **selalu baca dokumen yang relevan terlebih dahulu:**

| Konteks | Baca |
|---------|------|
| Memahami requirements & fokus Banjarnegara | `docs/PRD_REHABTRACK_v0.2.md` |
| Membuat/mengubah database schema | `docs/DATA_MODEL.md` |
| Implementasi GEE, offline, security, GIS layers | `docs/TECHNICAL_SPEC.md` |
| Menentukan scope fitur | `docs/MVP_SCOPE.md` |
| Naming, conventions, prinsip, batas wilayah | `AGENTS.md` (file ini) |
