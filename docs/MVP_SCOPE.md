# REHABTRACK — MVP Scope & Roadmap v0.2

> Dokumen ini mendefinisikan scope yang **tepat** untuk setiap fase MVP.
> Tujuan: menghindari scope creep dan memastikan delivery yang realistis.

---

## Filosofi MVP

> Bangun yang **paling kecil** yang bisa membuktikan value proposition:
> *"Apakah kita bisa menunjukkan bahwa lahan yang direhabilitasi benar-benar mengalami pemulihan?"*

MVP bukan tentang fitur lengkap. MVP tentang **membuktikan bahwa pendekatan ini bekerja** di minimal 1 lokasi nyata.

---

## Fase Overview (Accelerated with Supabase)

```
┌─────────────────────────────────────────────────────────┐
│  MVP-α (Minggu 1-6)                                    │
│  "Field Data Foundation (Supabase Cloud + Next.js)"     │
│  ──────────────────────────────────────────────────     │
│  Supabase Auth, Projects, Plots, Monitoring, Storage,   │
│  Offline-first PWA, Dashboard Overview                  │
├─────────────────────────────────────────────────────────┤
│  MVP-β (Minggu 7-10)                                   │
│  "Satellite Intelligence (FastAPI + GEE Engine)"        │
│  ──────────────────────────────────────────────────     │
│  GEE Integration, Time Series, Comparison, Analytics    │
├─────────────────────────────────────────────────────────┤
│  Pilot (Minggu 9-10, overlap)                          │
│  "Real World Validation"                                │
│  ──────────────────────────────────────────────────     │
│  1 lokasi nyata, field data collection, validasi        │
├─────────────────────────────────────────────────────────┤
│  Phase 2 (Post-MVP)                                    │
│  "Scale & Engage"                                       │
│  ──────────────────────────────────────────────────     │
│  Adopt a Plot, Scoring, Early Warning, Public API       │
└─────────────────────────────────────────────────────────┘
```

---

## MVP-α: Field Data Foundation (Minggu 1–6)

### Goal
> Petugas lapangan dapat mendokumentasikan rehabilitasi lahan secara spasial, dan pengelola dapat melihat progress di dashboard — termasuk saat offline, didukung oleh Supabase Cloud backend.

### Scope — TERMASUK ✅

| Minggu | Deliverable | Detail |
|--------|-------------|--------|
| **1** | Setup & Foundation | Supabase project setup (Singapore), PostGIS extension, run SQL migrations, Next.js 14+ PWA init, design system tokens |
| **2** | Auth & Project Management | Supabase Auth (email/login), public.users trigger, Project CRUD + members with RLS, project list & detail UI |
| **3** | Plot Management & Map | Plot CRUD with GeoJSON/MapLibre GL Draw, auto-area calculation, species catalog, plot detail & status badges |
| **4** | Field Monitoring & Storage | Monitoring form (GPS, counts, canopy), photo upload to Supabase Storage bucket (`monitoring-photos`), photo gallery, history list |
| **5** | Offline-First Engine | Dexie.js (IndexedDB) local cache, offline monitoring submission, Workbox PWA service worker, auto-sync queue to Supabase |
| **6** | Timeline, Dashboard & MVP-α Polish | Planting & intervention events, timeline view, project KPI RPC (`get_project_kpi`), overview dashboard, CSV export, test pass |

### Scope — TIDAK TERMASUK ❌ (di MVP-α)

- GEE integration
- NDVI / EVI / satellite data
- Time series visualization
- Before/After comparison
- Rehabilitation score
- Early warning
- Adopt a Plot
- Public page
- PDF reporting
- Advanced analytics
- Multi-language

### Deliverable MVP-α

1. ✅ Web/PWA app dengan Supabase Auth
2. ✅ CRUD project + assign member dengan RLS security
3. ✅ CRUD plot dengan polygon di MapLibre map
4. ✅ Form monitoring lapangan + GPS + multi-photo ke Supabase Storage
5. ✅ Offline data entry (IndexedDB) + auto-sync
6. ✅ Planting event & intervention log with timeline
7. ✅ Dashboard: project overview, plot status map, monitoring history, KPI
8. ✅ CSV export monitoring data

### Success Criteria MVP-α

- [ ] 3 test projects berhasil dibuat dengan polygon plot
- [ ] 10 monitoring berhasil disubmit (5 online, 5 offline → sync ke Supabase)
- [ ] Foto tersimpan di Supabase Storage dan ter-display di monitoring history
- [ ] Dashboard menampilkan summary KPI via RPC function
- [ ] Map menampilkan semua plot dengan polygon interaktif
- [ ] Data export CSV berfungsi

---

## MVP-β: Satellite Intelligence (Minggu 7–10)

### Goal
> Sistem dapat mengambil data satelit dari GEE via FastAPI backend, menampilkan time series, dan membandingkan baseline vs current — memberikan evidence of recovery yang terukur.

### Scope — TERMASUK ✅

| Minggu | Deliverable | Detail |
|--------|-------------|--------|
| **7** | GEE Integration (FastAPI) | FastAPI service setup, GEE service account init, NDVI & EVI composite analysis, store results to Supabase |
| **8** | Time Series + Comparison | Time series line chart (NDVI, EVI via Recharts), before/after comparison table, seasonal awareness checks |
| **9** | Analytics Dashboard & Plot Status | Evaluation dashboard, multi-indicator plot status logic (RECOVERING/MONITORING/AT_RISK), KPI enhancement |
| **10** | Pilot Validation & Launch Polish | Pilot 1 lokasi nyata, field data collection, validate field vs satellite, bug fixing, documentation |

### Scope — TIDAK TERMASUK ❌ (di MVP-β)

- Adopt a Plot (full)
- Payment gateway
- Rehabilitation score (composite)
- Reference/Control area comparison
- Early warning (automated)
- NDMI, NBR, rainfall
- Forest Journal / Impact Report
- Public page (full)
- Mobile native app
- Gamification
- Public API
- Multi-tenant

### Deliverable MVP-β

1. ✅ GEE analysis untuk plot (NDVI, EVI, Land Cover)
2. ✅ Time series chart per plot per indicator
3. ✅ Before/After comparison (baseline vs current)
4. ✅ Plot status determination (multi-indicator)
5. ✅ Enhanced dashboard dengan satellite data
6. ✅ 1 pilot location validated

### Success Criteria MVP-β

- [ ] GEE berhasil menganalisis NDVI/EVI untuk minimal 5 plot di pilot site
- [ ] Time series chart menampilkan minimal 3 data points
- [ ] Before/After comparison menampilkan delta yang bermakna
- [ ] Plot status logic berjalan (GREEN/YELLOW/RED)
- [ ] Field data dan satellite data ditampilkan berdampingan
- [ ] 1 lokasi nyata tervalidasi end-to-end

---

## Pilot Site Requirements

### Kriteria Pemilihan Pilot

| Kriteria | Requirement |
|----------|-------------|
| Ukuran | Minimal 3 plot, masing-masing > 500 m² |
| Usia rehabilitasi | Sudah ditanam minimal 6 bulan |
| Aksesibilitas | Bisa dikunjungi petugas untuk monitoring |
| Data historis | Ada data baseline (tanggal tanam, jumlah, jenis) |
| Variasi | Idealnya ada plot yang baik dan yang bermasalah |

### Data Collection Plan

| Data | Sumber | Frekuensi |
|------|--------|-----------|
| GPS koordinat plot | Field (satu kali) | Awal |
| Polygon boundary | Field / existing GIS (satu kali) | Awal |
| Planting data | Records / interview | Awal |
| Monitoring kondisi tanaman | Field visit | 2x selama pilot |
| Foto kondisi | Field visit | Setiap monitoring |
| NDVI/EVI | GEE (automated) | Monthly composite |

---

## Phase 2: Scale & Engage (Post-MVP)

### Prioritized Backlog

| Priority | Feature | Effort | Value |
|----------|---------|--------|-------|
| P1 | **Public Project Page** | M | Transparansi, adopter funnel |
| P1 | **Adopt a Plot** (tanpa payment) | L | Community engagement core |
| P1 | **Forest Journal** | S | Engagement content |
| P1 | **Role & Permission** (advanced) | M | Multi-org support |
| P2 | **Rehabilitation Score** | M | Evaluasi terstruktur |
| P2 | **Reference/Control Area** | M | Kausalitas lebih kuat |
| P2 | **Early Warning** | M | Deteksi dini masalah |
| P2 | **Monitoring Reminders** | S | Data quality |
| P2 | **PDF/Excel Report** | M | Formal reporting |
| P3 | **NDMI/NBR/Rainfall** | S | Indikator tambahan |
| P3 | **Gamification** | M | Motivasi petugas |
| P3 | **Adopt a Plot + Payment** | L | Revenue stream |
| P3 | **Drone Data Integration** | L | Data resolution bridge |
| P3 | **Mobile Native App** | XL | Better offline UX |
| P3 | **Public API** | M | Interoperability |
| P3 | **Multi-tenant SaaS** | XL | Scale model |
| P4 | **ML Risk Prediction** | XL | Advanced analytics |
| P4 | **Carbon Estimation** | L | Future value stream |

*Effort: S=Small (1-2 minggu), M=Medium (2-4 minggu), L=Large (4-6 minggu), XL=Extra Large (6+ minggu)*

---

## Tim Minimum

### MVP (10 minggu)

| Role | Count | Responsibility |
|------|-------|---------------|
| **Fullstack Developer** | 1-2 | Frontend (Next.js + Supabase SDK), Backend (FastAPI GEE engine) |
| **GIS/GEE Specialist** | 1 | GEE scripts, spatial analysis, satellite data pipeline |
| **UI/UX Designer** | 0.5 | Wireframe, design system (bisa part-time) |
| **Domain Expert** | 0.5 | Rehabilitasi lahan, validation logic (bisa part-time/advisor) |

### Catatan Tim
- Jika solo developer: manfaatkan Supabase sepenuhnya, MVP-α lebih cepat, GEE pipeline dibangun di Minggu 7-10
- GIS/GEE specialist mulai aktif di minggu 6 (persiapan GEE scripts) dan full di minggu 7-10
- Domain expert kritis di minggu 1 (requirements) dan minggu 9-10 (pilot validation)

---

## Risk Checkpoints

| Checkpoint | Minggu | Decision |
|------------|--------|----------|
| **Supabase Setup & RLS Review** | 1 | Apakah Supabase Cloud Singapore, RLS policies, dan schema sudah siap? |
| **Offline Sync Validation** | 5 | Apakah offline IndexedDB sync ke Supabase bekerja reliable? |
| **GEE Feasibility** | 7 | Apakah GEE credentials & analysis pipeline terhubung lancar? |
| **Pilot Go/No-Go** | 8 | Apakah pilot site ready? Data baseline tersedia? |
| **MVP Assessment** | 10 | Apakah MVP membuktikan value proposition? Go/pivot/iterate? |

---

## Definition of Done (per Feature)

Sebuah fitur dianggap "Done" jika:

- [ ] Kode sudah di-review (atau self-review jika solo)
- [ ] Unit tests untuk logic penting
- [ ] Validasi input berfungsi
- [ ] Error handling proper (bukan generic error)
- [ ] Responsive (desktop + mobile)
- [ ] Offline-compatible (jika applicable)
- [ ] API endpoint terdokumentasi
- [ ] Tidak ada regresi pada fitur existing

---

*END OF MVP SCOPE*
