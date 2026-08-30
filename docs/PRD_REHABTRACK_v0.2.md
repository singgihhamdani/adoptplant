# PRD — REHABTRACK v0.2

**Platform Monitoring & Evaluasi Rehabilitasi Lahan**
Berbasis Geotagging, Google Earth Engine, Time Series, dan Community Engagement

| Field | Value |
|-------|-------|
| Versi | 0.2 |
| Status | Draft — Direview |
| Bahasa | Indonesia |
| Target MVP-α | 6 Minggu |
| Target MVP-β | 4 Minggu |
| Changelog | v0.1 → v0.2: Incorporasi review (Supabase cloud Singapore, offline-first, data model enrichment, remote sensing strategy, security model, MVP split, competitive analysis, validation rules) |

---

## 1. Ringkasan Produk

**Nama kerja:** REHABTRACK

**Tagline:** "Dari aksi penanaman menuju bukti pemulihan."

**Alternatif:** "Jangan hanya menanam. Ikuti sampai tumbuh."

REHABTRACK adalah platform untuk memantau dan mengevaluasi keberhasilan rehabilitasi lahan dengan menggabungkan:
- Data lapangan berbasis geotagging dan foto kondisi tanaman
- Analisis citra satelit melalui Google Earth Engine (GEE)
- Visualisasi time series perubahan kondisi lahan
- Community engagement melalui "Adopt a Plot"

**Pertanyaan utama yang dijawab REHABTRACK:**

> "Apakah lahan yang telah direhabilitasi benar-benar mengalami pemulihan?"

REHABTRACK **tidak** berfokus pada pencatatan jumlah pohon yang ditanam. Fokus utamanya adalah **evidence of recovery**.

### Wilayah Pilot & Implementasi Awal: Kabupaten Banjarnegara
Pada tahap awal, implementasi dan validasi platform REHABTRACK difokuskan pada **Kabupaten Banjarnegara, Jawa Tengah**.
- **Karakteristik Wilayah:** Kawasan hulu DAS Serayu dengan topografi berbukit/pegunungan, kerentanan longsor, hutan rakyat, dan agroforestri.
- **Dukungan Batas Administrasi & Data Tematik Kebencanaan Lokal:**
  - Batas Administrasi (`data/map/BOUNDARY/` - 20 Kecamatan & 278 Desa/Kelurahan)
  - Pola Ruang / RTRW (`data/map/POLA RUANG V2/` - 14 Zonasi Tata Ruang Wilayah)
  - Kerawanan & Riwayat Kejadian Bencana BPBD (`data/map/KELAS DAN INDEKS BENCANA/` - Peta Bahaya Longsor & 244 Titik Riwayat)
  - Dampak Bencana Dasimetrik (`data/databaru/dataimpact/` - Estimasi Penduduk Terpapar Bahaya Longsor 374k Jiwa & Banjir)
- **Fungsi Analisis Spasial Kontekstual:** Sebagai layer overlay analitis untuk memvalidasi legalitas tata ruang, memprioritaskan penanaman pohon pengikat tanah di zona merah lereng kritis, serta mengukur dampak proteksi penduduk sekitar (*Ecosystem-based Disaster Risk Reduction / Eco-DRR*).

---

## 2. Latar Belakang

Kegiatan penanaman pohon dan rehabilitasi lahan telah dilakukan oleh berbagai pihak. Namun keberhasilan program sering kali lebih mudah diukur dari aktivitas awal (jumlah bibit, luas area) dibandingkan perubahan kondisi lahan dalam jangka menengah dan panjang.

### Masalah yang Diselesaikan

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Data penanaman tersebar, tanpa koordinat akurat | Tidak bisa dipetakan dan diverifikasi |
| 2 | Kondisi tanaman pasca-tanam tidak dimonitor rutin | Kematian massal tidak terdeteksi dini |
| 3 | Tanaman mati/tumbuh buruk terlambat diketahui | Biaya penyulaman membengkak |
| 4 | Evaluasi berbentuk snapshot, bukan temporal | Tidak terlihat tren pemulihan/penurunan |
| 5 | Jumlah pohon ditanam ≠ pemulihan ekosistem | Pelaporan misleading |
| 6 | Data lapangan dan remote sensing belum terintegrasi | Analisis tidak komprehensif |
| 7 | Donatur/masyarakat sulit melihat dampak kontribusi | Engagement rendah, donasi one-time |
| 8 | Sulit membuktikan kausalitas rehabilitasi → recovery | Tidak ada control/reference area |

---

## 3. Problem Statement

> "Penanaman pohon bukanlah akhir dari rehabilitasi. Tanpa monitoring dan evaluasi yang berkelanjutan, kita tidak mengetahui apakah tanaman bertahan dan apakah kondisi lahan benar-benar membaik."

**Pergeseran paradigma:**

| DARI | MENJADI |
|------|---------|
| "Berapa pohon yang ditanam?" | "Bagaimana kondisi lahan berubah setelah direhabilitasi?" |
| "Apakah program sudah dilaksanakan?" | "Apakah program menghasilkan pemulihan yang terukur?" |

---

## 4. Visi Produk

Membangun sistem monitoring rehabilitasi lahan yang transparan, berbasis data spasial dan temporal, sehingga setiap program rehabilitasi dapat dipantau **dari penanaman hingga pemulihan**.

**Visi jangka panjang:**

> "Setiap proyek rehabilitasi memiliki lokasi yang jelas, riwayat yang terdokumentasi, bukti perubahan yang dapat dianalisis, dan komunitas yang dapat ikut menjaga keberlanjutannya."

---

## 5. Target User & Persona

### A. Pengelola Program Rehabilitasi

**Persona:** *Ibu Sari, Koordinator Rehabilitasi DAS di Dinas LHK Kabupaten Banyumas. Mengelola 8 proyek rehabilitasi, 42 plot, dengan budget terbatas dan tekanan pelaporan triwulanan ke pusat.*

- Pemerintah daerah, NGO/LSM, organisasi lingkungan, pengelola kawasan, perusahaan
- **Kebutuhan:** Memetakan proyek, mengelola monitoring, mengevaluasi hasil, membuat laporan

### B. Petugas Lapangan

**Persona:** *Mas Andi, petugas kehutanan di lapangan. Menggunakan HP Android entry-level (RAM 3GB). Sering bekerja di area tanpa sinyal internet. Butuh workflow cepat karena harus memonitor 5-8 plot per hari.*

- **Kebutuhan:** Mengambil koordinat dan foto, mencatat kondisi tanaman, monitoring plot
- **Constraint kritis:** HP entry-level, sering offline, waktu terbatas per plot

### C. Koordinator/Manajer

**Persona:** *Pak Hendra, manajer program rehabilitasi di sebuah NGO internasional. Harus melaporkan progress ke donor luar negeri dengan data yang kredibel.*

- **Kebutuhan:** Overview seluruh proyek, perbandingan antar lokasi, identifikasi risiko, evaluasi performa

### D. Masyarakat/Donatur (Adopter)

**Persona:** *Dina, profesional muda di Jakarta yang ingin berkontribusi pada rehabilitasi lingkungan. Skeptis terhadap program "tanam pohon" karena tidak pernah tahu apakah pohonnya benar-benar tumbuh.*

- **Kebutuhan:** Menemukan proyek, mendukung/adopt plot, melihat perkembangan dan dampak

### E. Publik

- **Kebutuhan:** Melihat proyek publik, memahami kondisi rehabilitasi, melihat bukti perubahan

---

## 6. Competitive Landscape

| Platform | Fokus | Kelemahan vs REHABTRACK |
|----------|-------|------------------------|
| **Restor** (restor.eco) | Restorasi ekosistem global, pemetaan | Tidak ada field monitoring workflow, tidak ada time series per-plot |
| **TreeMapper** (Plant-for-the-Planet) | Tracking penanaman pohon individual | Fokus pada counting trees, bukan landscape recovery |
| **Open Foris / Collect Earth** (FAO) | Monitoring lahan untuk pemerintah | Kompleks, butuh training, tidak ada community engagement |
| **Land PKS** | Monitoring perkebunan sawit | Domain spesifik sawit, bukan rehabilitasi |
| **One Tree Planted / Ecosia** | Donasi pohon | Zero transparency tentang survival/recovery |

**Posisi REHABTRACK:**
- Satu-satunya yang menggabungkan **field monitoring + satellite analysis + time series + community engagement** dalam satu platform
- Fokus pada **evidence of recovery**, bukan counting trees
- Dirancang untuk konteks Indonesia (bahasa, konektivitas, device)

---

## 7. Konsep Produk — 3 Layer

```
┌─────────────────────────────────────────────┐
│  LAYER 3 — ENGAGEMENT                      │
│  Adopt a Plot, Forest Journal, Impact Report│
├─────────────────────────────────────────────┤
│  LAYER 2 — EVIDENCE                        │
│  Field Monitoring, GEE/Satellite,           │
│  Time Series, Before/After, Evaluation      │
├─────────────────────────────────────────────┤
│  LAYER 1 — ACTION                          │
│  Project, Plot, Planting, Geotagging,       │
│  Intervention                               │
└─────────────────────────────────────────────┘
```

**Core product** = Layer 1 + Layer 2. Layer 3 memperkuat keberlanjutan dan engagement.

Layer 3 **tidak boleh** menjadi dependency dari Layer 1 atau 2.

---

## 8. Non-Goals / Batasan

Untuk menjaga fokus, REHABTRACK **TIDAK** bertujuan menjadi:

1. Marketplace tanaman
2. Platform crowdfunding umum (dengan payment gateway pada MVP)
3. Platform jual-beli karbon
4. Sistem identifikasi setiap pohon menggunakan AI
5. Sistem monitoring individu pohon menggunakan citra satelit
6. Platform rescue atau adopsi satwa
7. Pengganti sistem administrasi pemerintah
8. Sistem yang mengklaim NDVI membuktikan satu pohon hidup/mati

**Prinsip penting:**
- GEE mengamati perubahan pada tingkat **area/pixel**
- Data lapangan mengamati kondisi tanaman **secara langsung**
- Keduanya adalah **sumber bukti yang saling melengkapi**

---

## 9. Fitur Utama

### MVP-α (Minggu 1–6): Foundation + Field Data

| # | Fitur | Deskripsi |
|---|-------|-----------|
| F01 | Project & Plot Management | CRUD project, draw/upload polygon, auto-calculate area |
| F02 | Field Geotagging & Monitoring | Mobile monitoring dengan GPS, foto, kondisi tanaman |
| F03 | Planting & Intervention Log | Timeline event: penanaman, penyulaman, pemeliharaan |
| F04 | Offline-First Data Collection | Local storage + sync untuk petugas di area tanpa sinyal |
| F05 | Basic Dashboard | Overview project, plot list, monitoring history |

### MVP-β (Minggu 7–10): Satellite + Analytics

| # | Fitur | Deskripsi |
|---|-------|-----------|
| F06 | GEE Satellite Analysis | NDVI, EVI, Land Cover untuk area plot |
| F07 | Time Series Visualization | Line chart indikator over time |
| F08 | Before/After Comparison | Baseline vs Current period comparison |
| F09 | Evaluation Dashboard | KPI, status plot (recovering/monitoring/at_risk), analytics |
| F10 | Public Project Page | Halaman publik untuk project yang visible |

### Post-MVP / Phase 2

| # | Fitur |
|---|-------|
| F11 | Adopt a Plot (dengan payment gateway) |
| F12 | Rehabilitation Score |
| F13 | Reference/Control Area |
| F14 | Early Warning System |
| F15 | Forest Journal & Impact Report |
| F16 | PDF/Excel Reporting |
| F17 | Rainfall Integration (CHIRPS) |
| F18 | NDMI/NBR indicators |
| F19 | Mobile offline-first (enhanced) |
| F20 | Automated monitoring reminders |
| F21 | Public API |
| F22 | Project verification |
| F23 | Multi-tenant SaaS |
| F24 | Role & permission management (advanced) |
| F25 | Drone data integration |
| F26 | Gamification petugas lapangan |

---

## 10. Feature Detail — F01: Project & Plot Management

### Project

| Field | Type | Required | Catatan |
|-------|------|----------|---------|
| id | UUID | Auto | |
| name | string | ✅ | |
| description | text | ✅ | |
| manager_id | FK → User | ✅ | |
| location_name | string | ✅ | Nama lokasi umum (desa/kecamatan) |
| province | string | ✅ | |
| start_date | date | ✅ | |
| target_area_ha | decimal | ✅ | Dalam hektar |
| target_plants | integer | | |
| status | enum | ✅ | PLANNING / ACTIVE / COMPLETED / SUSPENDED |
| visibility | enum | ✅ | PUBLIC / PRIVATE |
| created_at | timestamp | Auto | |
| updated_at | timestamp | Auto | |

### Plot

| Field | Type | Required | Catatan |
|-------|------|----------|---------|
| id | UUID | Auto | |
| project_id | FK → Project | ✅ | |
| name | string | ✅ | |
| geom | PostGIS Polygon | ✅ | Upload GeoJSON atau draw di map |
| area_m2 | decimal | Auto | Dihitung dari geometry |
| rehabilitation_type | enum | ✅ | REFORESTATION / AGROFORESTRY / dll |
| baseline_date | date | ✅ | |
| baseline_description | text | | Kondisi awal (naratif) |
| target_plants | integer | | |
| monitoring_status | enum | Auto | RECOVERING / MONITORING / AT_RISK |
| adoptable | boolean | Default false | Apakah bisa di-adopt publik |
| created_at | timestamp | Auto | |
| updated_at | timestamp | Auto | |

**Fungsi:**
- Create/edit project
- Upload/import boundary (GeoJSON, KML, Shapefile)
- Draw polygon pada map (MapLibre GL)
- Auto-calculate luas dari geometry
- Assign plot ke project

---

## 11. Feature Detail — F02: Field Geotagging & Monitoring

### Mode Monitoring

| Mode | Digunakan Untuk |
|------|-----------------|
| **Individual Sample** | Tanaman sampel atau tanaman penting |
| **Plot Monitoring** | Monitoring keseluruhan plot (rehabilitasi massal) |

### Data Field Monitoring

| Field | Type | Required | Catatan |
|-------|------|----------|---------|
| id | UUID | Auto | |
| plot_id | FK → Plot | ✅ | |
| date | date | ✅ | |
| geom | PostGIS Point | ✅ | Lokasi petugas saat monitoring |
| gps_accuracy_m | decimal | ✅ | Akurasi GPS dalam meter |
| healthy_count | integer | ✅ | |
| stressed_count | integer | ✅ | |
| dead_count | integer | ✅ | |
| missing_count | integer | Default 0 | |
| survival_rate | decimal | Auto | Calculated |
| avg_height_cm | decimal | | |
| avg_diameter_cm | decimal | | |
| canopy_cover_pct | decimal | | Estimasi visual tutupan kanopi |
| notes | text | | |
| observer_id | FK → User | ✅ | |
| sync_status | enum | Auto | PENDING / SYNCED / FAILED |
| synced_at | timestamp | Nullable | |
| created_at | timestamp | Auto | Lokal device time |

### Photo (entity terpisah)

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Auto |
| monitoring_id | FK → FieldMonitoring | ✅ |
| url | string | ✅ |
| thumbnail_url | string | Auto |
| caption | string | |
| taken_at | timestamp | Dari EXIF |
| exif_lat | decimal | Nullable |
| exif_lon | decimal | Nullable |
| file_size_bytes | integer | Auto |
| created_at | timestamp | Auto |

**Prinsip:**
- Tidak semua pohon harus diberi geotag individual
- Untuk area besar, gunakan plot + sampling agar proses lapangan realistis
- Minimum 1 foto, maksimum 10 foto per monitoring
- Koordinat monitoring harus berada di dalam polygon plot (validasi spatial)

**Kondisi tanaman:** `HEALTHY` | `STRESSED` | `DEAD` | `MISSING` | `UNKNOWN`

---

## 12. Feature Detail — F03: Planting & Intervention Log

Setiap aktivitas penting dicatat sebagai event dan ditampilkan sebagai timeline.

### Planting Event

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Auto |
| plot_id | FK → Plot | ✅ |
| date | date | ✅ |
| species_id | FK → Species | ✅ |
| quantity | integer | ✅ |
| notes | text | |
| created_at | timestamp | Auto |

### Species (catalog terpisah)

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Auto |
| common_name | string | ✅ |
| scientific_name | string | |
| category | enum | | TREE / SHRUB / GRASS / MANGROVE / OTHER |
| native | boolean | | Apakah spesies lokal |

### Intervention

| Field | Type | Required |
|-------|------|----------|
| id | UUID | Auto |
| plot_id | FK → Plot | ✅ |
| date | date | ✅ |
| type | enum | ✅ |
| quantity | integer | | Jumlah tanaman jika replanting |
| description | text | ✅ |
| photo_url | string | |
| created_at | timestamp | Auto |

**Jenis intervention:** `PLANTING` | `REPLANTING` | `MAINTENANCE` | `FERTILIZATION` | `WATERING` | `PEST_CONTROL` | `OTHER`

**Contoh timeline:**
```
2026-03-10  Baseline survey
2026-06-15  Penanaman 2.500 tanaman
2026-09-20  Monitoring #1 — Survival 88%
2026-10-05  Penyulaman 300 tanaman
2027-03-15  Monitoring #2 — Survival 91%
```

---

## 13. Feature Detail — F04: Offline-First Data Collection

> [!IMPORTANT]
> Petugas lapangan bekerja di area dengan konektivitas rendah atau tanpa sinyal. Offline capability adalah **requirement MVP**, bukan fitur tambahan.

### Mekanisme

1. **Local Storage:** Semua data monitoring (termasuk foto) disimpan di IndexedDB/SQLite device
2. **Queue System:** Data yang belum ter-sync masuk antrian upload
3. **Auto-Sync:** Saat koneksi tersedia, data di-sync otomatis
4. **Conflict Resolution:** Last-write-wins untuk data sederhana, manual merge untuk konflik
5. **Status Indicator:** UI menampilkan status sync (pending/synced/failed)
6. **Retry Logic:** Failed sync di-retry otomatis dengan exponential backoff

### Data yang Harus Tersedia Offline

- Daftar project dan plot yang di-assign
- Polygon plot (untuk validasi koordinat di dalam boundary)
- Species catalog
- Form monitoring (full functionality tanpa internet)
- Foto capture dan storage

### Data yang Membutuhkan Online

- GEE satellite data
- Time series visualization
- Dashboard analytics
- Sync upload

---

## 14. Feature Detail — F06: GEE Satellite Analysis

### Remote Sensing Data Strategy

#### Dataset Utama

| Dataset | Resolusi | Revisit | Digunakan Untuk |
|---------|----------|---------|-----------------|
| Sentinel-2 L2A | 10m | 5 hari | NDVI, EVI, visual RGB |
| Landsat 8/9 L2 | 30m | 16 hari | Time series jangka panjang, cross-validation |
| Dynamic World | 10m | ~daily | Land cover classification |
| Hansen GFC | 30m | Annual | Tree cover, forest loss/gain |

#### Cloud Masking Strategy (Kritis untuk Indonesia)

Indonesia memiliki tutupan awan rata-rata 60-80%. Strategi:
1. **Per-scene cloud masking** menggunakan QA60 band (Sentinel-2) atau QA_PIXEL (Landsat)
2. **Temporal composite** — median composite per periode (monthly/quarterly)
3. **Minimum valid pixels** — jika < 70% pixel valid dalam satu composite, tandai sebagai low quality
4. **Multi-sensor fusion** — gabungkan Sentinel-2 dan Landsat untuk menambah observasi valid

#### Composite Strategy

| Granularity | Metode | Use Case |
|-------------|--------|----------|
| Monthly | Median composite | Monitoring aktif, resolusi tinggi |
| Quarterly | Median composite | Default time series |
| Annual | Median composite | Long-term trend, before/after |
| Seasonal | Wet/Dry season composite | Menghindari bias musiman |

#### Spatial Consideration

| Ukuran Plot | Pixel Count (10m) | Rekomendasi |
|-------------|-------------------|-------------|
| < 500 m² | < 5 pixel | ⚠️ Terlalu kecil untuk analisis satelit yang reliable. Andalkan field data. |
| 500–5000 m² | 5–50 pixel | Sentinel-2 OK, interpretasi hati-hati |
| > 5000 m² | > 50 pixel | Sentinel-2 reliable, Landsat OK |
| > 1 ha | > 100 pixel | Semua dataset reliable |

### Satellite Observation Entity

| Field | Type | Required | Catatan |
|-------|------|----------|---------|
| id | UUID | Auto | |
| plot_id | FK → Plot | ✅ | |
| observation_date | date | ✅ | Tanggal atau center date composite |
| period_start | date | ✅ | Awal periode composite |
| period_end | date | ✅ | Akhir periode composite |
| ndvi | decimal | | -1 to 1 |
| evi | decimal | | -1 to 1 |
| ndmi | decimal | | Phase 2 |
| tree_cover_pct | decimal | | 0-100 |
| bare_land_pct | decimal | | 0-100 |
| vegetation_pct | decimal | | 0-100 |
| land_cover_class | string | | Dari Dynamic World |
| source_dataset | string | ✅ | e.g., "COPERNICUS/S2_SR_HARMONIZED" |
| cloud_cover_pct | decimal | ✅ | Cloud cover of scene/composite |
| valid_pixel_pct | decimal | ✅ | % pixel valid setelah cloud masking |
| quality_flag | enum | Auto | HIGH / MEDIUM / LOW |
| created_at | timestamp | Auto | |

---

## 15. Feature Detail — F07: Time Series

Time Series adalah fitur inti REHABTRACK.

**Tujuan:** Menunjukkan bagaimana kondisi plot berubah dari waktu ke waktu.

### Parameter Visualisasi

| Parameter | Options |
|-----------|---------|
| Plot | Single plot atau compare multiple plots |
| Indicator | NDVI, EVI, Tree Cover, Bare Land, Survival Rate |
| Date Range | Custom range |
| Granularity | Monthly / Quarterly / Annual |

### Visualisasi
- **Primary:** Line chart dengan data points
- **Secondary:** Area chart untuk land cover composition
- **Overlay:** Intervention markers pada timeline (penanaman, penyulaman, dll)
- **Annotation:** Seasonal bands (wet/dry season) untuk konteks

### Aturan
- Sistem harus menyimpan **historical observations** — grafik bukan real-time query ke GEE
- Granularity mengikuti ketersediaan data
- Periode musiman yang berbeda harus ditandai visual untuk menghindari interpretasi yang menyesatkan

---

## 16. Feature Detail — F08: Before/After Comparison

User membandingkan: **Baseline Period** vs **Current Period**

**Contoh:**
```
Baseline: Jan-Dec 2024
Current:  Jan-Dec 2026
```

**Output:**

| Indicator | Baseline | Current | Change | Trend |
|-----------|----------|---------|--------|-------|
| NDVI | 0.21 | 0.46 | +0.25 (+119%) | ↑ |
| Tree Cover | 8% | 27% | +19pp | ↑ |
| Bare Land | 62% | 34% | -28pp | ↓ (baik) |
| Survival Rate | — | 88% | — | — |

### Aturan Penting
- **Hindari perbandingan lintas musim** yang menyesatkan (wet vs dry season)
- Gunakan **periode musiman yang sebanding** (e.g., dry-to-dry, annual-to-annual)
- Tampilkan **peringatan** jika periode tidak sebanding
- Tampilkan **quality flag** jika data satellite low quality

---

## 17. Feature Detail — F09: Evaluation Dashboard

### KPI Utama

| KPI | Sumber | Level |
|-----|--------|-------|
| Luas rehabilitasi (ha) | Plot geometry | Project |
| Jumlah tanaman ditanam | Planting events | Project |
| Jumlah monitoring dilakukan | Field monitoring | Project/Plot |
| Survival rate (%) | Field monitoring | Plot |
| Perubahan NDVI | Satellite | Plot |
| Perubahan tree cover | Satellite | Plot |
| Area recovering (ha) | Composite | Project |
| Area at risk (ha) | Composite | Project |

### Status Plot

| Status | Warna | Kriteria |
|--------|-------|----------|
| **RECOVERING** | 🟢 Green | NDVI trend positif DAN survival rate > 70% DAN land cover membaik |
| **MONITORING** | 🟡 Yellow | Mixed signals ATAU data tidak cukup ATAU perlu inspeksi |
| **AT_RISK** | 🔴 Red | NDVI trend negatif ATAU survival rate < 50% ATAU land cover memburuk |

> [!IMPORTANT]
> Status **TIDAK BOLEH** ditentukan hanya dari satu indikator. Minimal 2 sumber bukti (field + satellite) harus dikombinasikan.

---

## 18. Reference / Control Area (Phase 2)

Fitur sangat direkomendasikan setelah MVP.

**Tujuan:** Membedakan perubahan akibat rehabilitasi vs perubahan alami (musim, curah hujan, faktor lingkungan).

**Contoh:**
```
Rehabilitated Plot: NDVI +30%
Reference Area:     NDVI +8%
Net Effect:         +22% (attributable to rehabilitation)
```

> Hasil ini tetap diperlakukan sebagai **evidence**, bukan klaim kausal otomatis.

---

## 19. Adopt a Plot (Post-MVP)

### Model

"Adopt a Plot" — bukan sekadar "membeli pohon", tapi membangun hubungan adopter dengan area rehabilitasi.

### Definisi

| Aspek | Definisi |
|-------|---------|
| **Bentuk adopsi** | Dukungan finansial dan/atau komitmen moral terhadap sebuah plot |
| **Durasi** | Minimal 1 tahun, renewable |
| **Batas adopter** | Tidak dibatasi per plot (shared adoption) |
| **Jika plot gagal** | Adopter diberitahu, diberi opsi pindah ke plot lain |
| **Revenue model** | REHABTRACK mengambil platform fee (persentase TBD) |

### Adopter Dapat
- Mendukung plot
- Melihat progress (foto, monitoring, time series)
- Menerima Forest Journal updates
- Melihat impact report

### Prinsip
- Kontribusi harus dikaitkan dengan proyek/plot yang jelas
- Dana terkumpul ≠ rehabilitasi berhasil — impact tetap harus dibuktikan melalui monitoring

---

## 20. User Flow

### Flow Pengelola
```
Login → Create Project → Draw/Upload Plot → Input Baseline →
Input Planting Event → Assign Petugas → Monitor Dashboard →
Satellite Analysis → Time Series → Evaluation → Report
```

### Flow Petugas Lapangan
```
Login → Pilih Project → Pilih Plot → Start Monitoring →
Auto-GPS → Ambil Foto → Input Kondisi → Submit (local) →
Auto-Sync saat online → Data tersimpan di server
```

### Flow Donatur/Adopter
```
Explore Project → Pilih Plot → Lihat Kondisi → Adopt/Support →
Follow Progress → Terima Forest Journal → Lihat Time Series →
Lihat Impact Report
```

---

## 21. Dashboard Pages

| # | Halaman | Konten Utama |
|---|---------|-------------|
| 1 | **Overview** | Total projects, total area, total planted, avg survival, area recovering, area at risk, map |
| 2 | **Project Detail** | Project summary, map, KPI, timeline, plot list |
| 3 | **Plot Detail** | Polygon, planting data, field monitoring, photos, satellite indicators, time series, before/after, interventions |
| 4 | **Analytics** | NDVI trend, EVI trend, land cover, comparison, reference area |
| 5 | **Public / Adopt** | Project story, plot cards, progress, updates, impact |

---

## 22. Security & Permission Model

### Roles

| Role | Scope | Kemampuan |
|------|-------|-----------|
| `SUPER_ADMIN` | System-wide | Semua akses |
| `PROJECT_MANAGER` | Per-project | CRUD project/plot, assign petugas, analytics |
| `FIELD_OFFICER` | Per-project | Input monitoring, foto, intervention |
| `VIEWER` | Per-project | Read-only dashboard dan analytics |
| `ADOPTER` | Per-plot (public) | Lihat progress plot yang diadopsi |
| `PUBLIC` | Public projects | Lihat project/plot publik |

### Privacy Rules

1. Koordinat plot pada project **PRIVATE** tidak boleh diekspos ke publik (risiko illegal logging)
2. Foto petugas → strip EXIF GPS metadata sebelum display ke publik
3. API endpoint memvalidasi project membership sebelum return data
4. Adopter hanya melihat data plot yang mereka adopt (dan hanya jika project public)
5. Audit log untuk setiap perubahan data sensitif

---

## 23. Data Validation Rules

### GPS/Koordinat
- Accuracy threshold: ≤ 50m untuk monitoring, ≤ 20m untuk planting
- Koordinat monitoring **harus di dalam polygon plot** (spatial containment)
- Koordinat di Indonesia: lat -11° s/d 6°, lon 95° s/d 141°

### Foto
- EXIF metadata dipreservasi (timestamp, GPS jika ada)
- Mandatory: minimum 1 foto per monitoring
- Maksimum: 10 foto per monitoring
- Kompresi client-side sebelum upload (max 2MB/foto)

### Data Entry
- `survival_rate` = auto-calculated dari counts
- Total counts ≤ total planted pada plot
- Height/diameter > 0 jika diisi
- Tanggal monitoring ≥ tanggal penanaman plot
- Duplikat monitoring (same plot, same date, same observer) → warning

### Satellite
- Cloud cover > 30% → quality_flag = LOW
- Valid pixel < 70% → quality_flag = LOW
- Minimum 3 observasi valid/tahun untuk time series yang bermakna

---

## 24. Monitoring Frequency Guidelines

| Periode | Frekuensi Rekomendasi | Alasan |
|---------|----------------------|--------|
| 0–6 bulan pasca-tanam | Bulanan | Fase kritis — kematian dini terdeteksi cepat |
| 6–12 bulan | Setiap 2 bulan | Tanaman mulai establish |
| 1–3 tahun | Triwulanan | Monitoring pertumbuhan |
| > 3 tahun | Semesteran | Maintenance monitoring |

Pengelola dapat menyesuaikan frekuensi sesuai kebutuhan. Sistem memberikan **reminder otomatis** jika monitoring terlambat dari jadwal.

---

## 25. Risiko & Mitigasi

| # | Risiko | Mitigasi |
|---|--------|----------|
| 1 | GEE tidak deteksi pohon kecil | GEE untuk area-level, field data untuk individual |
| 2 | NDVI naik bukan karena rehabilitasi | Gabungkan field monitoring, land cover, reference area |
| 3 | Bias musiman pada perbandingan | Periode pembanding sebanding, seasonal composite |
| 4 | Crowdfunding melebar scope | Adopt a Plot = engagement layer only. Payment di post-MVP |
| 5 | Data lapangan tidak rutin | Monitoring sederhana, reminder, gamification |
| 6 | Kualitas GPS/foto buruk | Validation rules, accuracy check, mandatory photo |
| 7 | Score menyederhanakan kondisi | Score transparan, selalu traceable ke indikator |
| 8 | Konektivitas lapangan buruk | Offline-first architecture (MVP requirement) |
| 9 | Plot terlalu kecil untuk satelit | Warning di UI, prioritaskan field data |
| 10 | Koordinat publik → illegal logging | Private projects default, koordinat di-mask untuk publik |

---

## 26. Prinsip Desain Produk

1. **Evidence over Activity** — Fokus pada bukti pemulihan, bukan jumlah aktivitas
2. **Map First, Data Second** — Lokasi adalah konteks utama
3. **Time Matters** — Perubahan temporal > snapshot
4. **Field + Satellite** — Dua sumber bukti saling melengkapi
5. **Simple Field Workflow** — Cepat, offline-ready, minimal input
6. **Transparent Impact** — Kontribusi dikaitkan dengan proyek/plot dan perkembangan nyata
7. **Explainable Analytics** — Tidak ada angka yang tidak bisa dijelaskan

---

## 27. North Star Metric

> "Jumlah plot rehabilitasi yang memiliki bukti monitoring temporal dan dapat menunjukkan status pemulihan yang dapat ditindaklanjuti."

**Secondary metrics:**
- Jumlah monitoring submissions
- Rata-rata survival rate across plots
- Jumlah plot dengan time series ≥ 3 observasi
- Jumlah adopter aktif (post-MVP)

---

## 28. Killer Feature: Rehabilitation Timeline

Satu plot dapat dilihat sebagai **perjalanan lengkap**:

```
BASELINE → PLANTING → MONITORING → INTERVENTION →
SATELLITE CHANGE → FIELD VALIDATION → RECOVERY STATUS
```

Dalam satu tampilan, pengguna memahami:
- Apa yang dilakukan?
- Kapan dilakukan?
- Di mana dilakukan?
- Apa yang terjadi setelahnya?
- Apakah kondisinya membaik?

---

## 29. Contoh Skenario

**Project:** Rehabilitasi Lahan DAS Serayu
**Plot:** PLT-023 | Luas: 500 m² | Penanaman: 120 tanaman

| Data Point | Baseline | Current |
|------------|----------|---------|
| NDVI | 0.21 | 0.46 |
| Tree Cover | 8% | 27% |
| Survival Rate | — | 88% |
| Field Status | — | Healthy: 94, Stressed: 12, Dead: 14 |

**Interpretasi:** Vegetation indicators menunjukkan recovery positif, sementara data lapangan menunjukkan sebagian tanaman masih mengalami tekanan.

**Rekomendasi:** Inspeksi area dengan tanaman stres/mati, evaluasi kebutuhan penyulaman.

**Jika plot diadopt:**
> "Plot ini didukung oleh 24 adopter. Adopter dapat melihat foto, monitoring, timeline, NDVI trend, progress, dan impact update."

---

## 30. MVP Success Criteria

MVP dianggap berhasil apabila:

- [ ] Pengguna dapat membuat project dan plot dengan polygon
- [ ] Petugas dapat melakukan monitoring dengan geotagging (termasuk offline)
- [ ] Foto disimpan bersama data monitoring (multiple photos)
- [ ] Data historis monitoring dapat ditampilkan
- [ ] Sistem dapat menganalisis data GEE untuk area pilot
- [ ] NDVI time series dapat ditampilkan
- [ ] Baseline vs current comparison berfungsi
- [ ] Dashboard menunjukkan status setiap plot
- [ ] Minimal 1 lokasi nyata berhasil diuji
- [ ] Evaluasi sederhana menunjukkan RECOVERING / MONITORING / AT_RISK

---

## 31. Phase 3 — Ecosystem Vision

Jangka panjang REHABTRACK dapat berkembang:

```
Project → Funding → Planting → Monitoring → Remote Sensing →
Evaluation → Impact → Community Engagement
```

**Kemungkinan ekspansi:**
- Conservation project
- Habitat restoration
- Watershed rehabilitation
- Biodiversity monitoring
- Corporate environmental programs
- Government rehabilitation programs
- Drone data integration
- ML risk prediction

> Ekspansi dilakukan **setelah core monitoring product terbukti**.

---

*END OF PRD v0.2*
