# REHABTRACK — Technical Specification v0.2

> Spesifikasi teknis untuk implementasi REHABTRACK.
> Mencakup: arsitektur, GEE integration, offline-first, security, API, dan deployment.

---

## 1. System Architecture (Hybrid Supabase + FastAPI)

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Web App     │  │  Mobile PWA │  │  Public Page         │  │
│  │  (Next.js)   │  │  (Offline)  │  │  (SSR/Static)        │  │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼────────────────────┼─────────────┘
          │                 │                    │
          ├─────────────────┴────────────────────┤
          │                                      │
          ▼                                      ▼
┌───────────────────────────┐          ┌──────────────────────────────┐
│    SUPABASE CLOUD         │          │      FASTAPI SERVICE         │
│ (Singapore ap-southeast-1)│          │      (Python 3.11+)          │
│                           │          │                              │
│  • Auth & User Sessions   │          │  • GEE Satellite Pipeline    │
│  • PostgreSQL + PostGIS   │◄─────────┤  • Complex Spatial Analytics │
│  • Row Level Security     │          │  • CSV / GeoJSON Exports     │
│  • Supabase Storage       │          │  • EXIF Processing           │
│    (Photo Buckets)        │          │                              │
│  • Realtime Subscriptions │          │  ┌────────────────────────┐  │
│  • Database RPC Functions │          │  │ Celery Worker + Redis  │  │
└───────────────────────────┘          │  └──────────┬─────────────┘  │
                                       └─────────────┼────────────────┘
                                                     │
                                                     ▼
                                       ┌──────────────────────────────┐
                                       │ Google Earth Engine (Python) │
                                       └──────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Framework | **Next.js 14+** (App Router) | SSR untuk public pages, React untuk dashboard |
| Language | **TypeScript** (strict mode) | Type safety wajib |
| Database & Auth Client | **@supabase/ssr** + **@supabase/supabase-js** | Direct type-safe data access with RLS |
| State | **Zustand** + **TanStack React Query** | Zustand untuk client/UI state, React Query untuk server state caching |
| Map | **MapLibre GL JS** | Open-source, vector tiles, lightweight |
| Map Drawing | **@mapbox/mapbox-gl-draw** | Polygon drawing & editing |
| Charts | **Recharts** | Declarative, React-idiomatic time series visualization |
| Offline | **Workbox** (Service Worker) + **Dexie.js** (IndexedDB) | PWA offline-first & background sync |
| Forms | **React Hook Form** + **Zod** | Type-safe form validation |
| Styling | **Vanilla CSS** (design tokens) | Maximum flexibility & aesthetic control |

### Database & Core Backend (Supabase Cloud)

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Platform | **Supabase Cloud** (Region Singapore `ap-southeast-1`) | Low latency to Indonesia, managed infrastructure |
| Database | **PostgreSQL 15+** | Robust, open standard relational database |
| Spatial Extension | **PostGIS 3.3+** | Industry standard spatial indexing & analysis |
| Authentication | **Supabase Auth** | JWT, email/password, session management |
| Storage | **Supabase Storage** | S3-compatible, access-controlled photo buckets |
| Security | **Row Level Security (RLS)** | Declarative database-level access control |
| Realtime | **Supabase Realtime** | WebSocket updates for sync & monitoring status |

### Analytics & Remote Sensing Backend (FastAPI)

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Framework | **FastAPI** | Async, high performance Python web framework |
| Language | **Python 3.11+** | Official Google Earth Engine SDK compatibility |
| Remote Sensing | **earthengine-api** | Google Earth Engine Python SDK |
| Task Queue | **Celery** + **Redis** | Asynchronous satellite processing pipeline |
| Supabase Integration | **supabase-py** | Service role access for backend writes |
| Validation | **Pydantic v2** | Request/response data validation |
| Testing | **pytest** + **httpx** | Automated endpoint & logic testing |

---

## 3. API Design

## 3. API & Data Access Architecture

### Overview

REHABTRACK uses a **hybrid data access model**:
- **Direct Supabase Data Access (Client SDK + PostgREST + RLS):** For all standard transactional data operations (Auth, Projects, Plots, Planting, Field Monitoring, Photos, Adoptions, Timeline).
- **FastAPI Endpoints:** For operations requiring server-side Python runtime, heavy asynchronous compute, external APIs, and file generation.

---

### A. Supabase Client Operations (Frontend Direct with RLS)

| Entity / Domain | Operation | Method | Client Security |
|-----------------|-----------|--------|-----------------|
| **Auth** | Sign Up, Sign In, Sign Out, Session Refresh | `supabase.auth.*` | Supabase Auth JWT |
| **Projects** | List, Create, Read, Update, Delete | `supabase.from('projects').*` | RLS (`projects_select`, etc.) |
| **Project Members** | List, Add, Remove, Role Assignment | `supabase.from('project_members').*` | RLS (`project_members_manage`) |
| **Plots** | List, Create with GeoJSON, Read, Update | `supabase.from('plots').*` | RLS (`plots_select`, `plots_insert`) |
| **Species** | Catalog List, Create | `supabase.from('species').*` | RLS (`species_select`) |
| **Planting Events** | List by Plot, Create Event | `supabase.from('planting_events').*` | RLS (`plots` membership) |
| **Field Monitorings** | List, Create with Point, Batch Sync | `supabase.from('field_monitorings').*` | RLS (`monitorings_insert`) |
| **Photos** | Upload to Bucket, Insert Photo Record | `supabase.storage.from('monitoring-photos')` | Storage RLS Policies |
| **Interventions** | List, Create Intervention | `supabase.from('interventions').*` | RLS (`plots` membership) |
| **Satellite Obs** | Read Time Series History | `supabase.from('satellite_observations').*` | RLS (`satellite_obs_select`) |
| **KPI & Aggregation** | Get Project KPI Summary | `supabase.rpc('get_project_kpi')` | PostgreSQL Function |

---

### B. FastAPI Service Endpoints

Base URL: `http://localhost:8000/api/v1` (Dev) / `https://api.rehabtrack.id/api/v1` (Prod)
Header: `Authorization: Bearer <SUPABASE_JWT_TOKEN>`

#### Satellite & GEE Processing
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/satellite/analyze` | Trigger asynchronous GEE analysis for a plot | ✅ Manager |
| GET | `/satellite/status/:jobId` | Check Celery background analysis job status | ✅ Authenticated |
| POST | `/satellite/batch-analyze` | Trigger batch GEE analysis for entire project | ✅ Manager |

#### Advanced Spatial & Analytics
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/analytics/projects/:id/summary` | Multi-indicator statistical evaluation | ✅ Authenticated |
| GET | `/analytics/plots/:id/comparison` | Before vs After comparative metrics with seasonal check | ✅ Authenticated |

#### Exports
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/exports/projects/:id/monitorings.csv` | Export monitoring time series as CSV | ✅ Member |
| GET | `/exports/projects/:id/plots.geojson` | Export plot boundaries as GeoJSON | ✅ Member |
| GET | `/exports/projects/:id/report.pdf` | Generate comprehensive project PDF report (Phase 2) | ✅ Member |

---

## 4. GEE Integration Architecture

### Processing Pipeline

```
1. User triggers analysis for a plot
        │
        ▼
2. Backend creates GEE task (Celery)
        │
        ▼
3. Celery worker:
   a. Authenticate with GEE service account
   b. Load plot geometry from PostGIS
   c. Build image collection filter:
      - Date range
      - Bounds (plot geometry)
      - Cloud cover < threshold
   d. Apply cloud masking
   e. Create composite (median)
   f. Calculate indices (NDVI, EVI, etc.)
   g. Reduce region (mean/median per plot)
   h. Extract values
        │
        ▼
4. Store results in satellite_observations table
        │
        ▼
5. Notify frontend (WebSocket / polling)
```

### GEE Authentication
- Gunakan **Service Account** (bukan personal account)
- Credentials disimpan sebagai environment variable, BUKAN di code
- Service account harus terdaftar di Google Cloud project dengan Earth Engine API enabled

### Example GEE Script (Pseudocode)
```python
import ee

def analyze_plot(plot_geom_geojson, start_date, end_date):
    """Analyze a single plot for NDVI/EVI using Sentinel-2."""
    
    aoi = ee.Geometry(plot_geom_geojson)
    
    # Load Sentinel-2 Surface Reflectance
    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
    )
    
    # Cloud masking using QA60
    def mask_clouds(image):
        qa = image.select("QA60")
        cloud_mask = qa.bitwiseAnd(1 << 10).eq(0).And(
            qa.bitwiseAnd(1 << 11).eq(0)
        )
        return image.updateMask(cloud_mask)
    
    masked = collection.map(mask_clouds)
    
    # Create monthly composites
    composite = masked.median()
    
    # Calculate NDVI
    ndvi = composite.normalizedDifference(["B8", "B4"]).rename("NDVI")
    
    # Calculate EVI
    evi = composite.expression(
        "2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))",
        {"NIR": composite.select("B8"),
         "RED": composite.select("B4"),
         "BLUE": composite.select("B2")}
    ).rename("EVI")
    
    # Reduce to plot statistics
    stats = ndvi.addBands(evi).reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=aoi,
        scale=10,
        maxPixels=1e9
    )
    
    # Get valid pixel percentage
    pixel_count = ndvi.reduceRegion(
        reducer=ee.Reducer.count(),
        geometry=aoi,
        scale=10
    )
    
    return stats.getInfo(), pixel_count.getInfo()
```

### Rate Limiting & Quotas
- GEE memiliki rate limit. Batch processing menggunakan Celery queue.
- Maksimum concurrent GEE tasks: 5 (configurable)
- Retry failed tasks dengan exponential backoff
- Cache hasil GEE — jangan query ulang untuk periode yang sudah diproses

---

## 5. Offline-First Architecture

### Stack
```
┌─────────────────────────────────┐
│          UI Layer               │
│  (React Components)            │
├─────────────────────────────────┤
│       Data Access Layer         │
│  ┌────────────┐ ┌────────────┐ │
│  │ Online     │ │ Offline    │ │
│  │ (Axios)    │ │ (Dexie.js) │ │
│  └────────────┘ └────────────┘ │
├─────────────────────────────────┤
│       Sync Engine               │
│  ┌────────────────────────────┐ │
│  │ Queue Manager              │ │
│  │ Conflict Resolution        │ │
│  │ Network Detection          │ │
│  └────────────────────────────┘ │
├─────────────────────────────────┤
│       Storage                   │
│  ┌──────────┐ ┌──────────────┐ │
│  │ IndexedDB │ │ Cache API   │ │
│  │ (Dexie)   │ │ (Workbox)   │ │
│  └──────────┘ └──────────────┘ │
└─────────────────────────────────┘
```

### Offline Data Schema (IndexedDB via Dexie.js)

```typescript
interface OfflineDB {
  // Data yang di-cache untuk akses offline
  projects: ProjectSummary[];      // Daftar project yang di-assign
  plots: PlotSummary[];            // Polygon + metadata plot
  species: Species[];              // Katalog spesies

  // Data yang dibuat offline, menunggu sync
  pendingMonitorings: PendingMonitoring[];
  pendingPhotos: PendingPhoto[];   // Blob foto menunggu upload
  
  // Sync metadata
  syncLog: SyncLogEntry[];
}

interface PendingMonitoring {
  localId: string;                 // UUID generated client-side
  plotId: string;
  date: string;
  lat: number;
  lon: number;
  gpsAccuracy: number;
  healthyCount: number;
  stressedCount: number;
  deadCount: number;
  missingCount: number;
  avgHeightCm?: number;
  avgDiameterCm?: number;
  canopyCoverPct?: number;
  notes?: string;
  photoLocalIds: string[];         // Reference ke pendingPhotos
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  createdAt: string;               // ISO timestamp (device time)
}
```

### Sync Strategy

1. **Network Detection:** `navigator.onLine` + periodic ping ke API health endpoint
2. **Queue Processing:**
   - Saat online, proses antrian FIFO
   - Upload foto terlebih dahulu, dapatkan URL
   - Kemudian submit monitoring data dengan photo URLs
3. **Conflict Resolution:**
   - Last-write-wins untuk data sederhana
   - Jika monitoring sudah ada di server (same plot + date + observer), tampilkan warning
4. **Retry:**
   - Max 5 retries per item
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Setelah max retries, tandai FAILED, notify user
5. **Data Freshness:**
   - Cache project/plot data saat online
   - Refresh cache setiap kali user buka app (jika online)
   - Tampilkan "last synced" timestamp di UI

---

## 6. Security Specification (Supabase Auth & RLS)

### Authentication Flow (Supabase Auth)

```
1. User login via Next.js client (@supabase/ssr)
        │
        ▼
2. Supabase Auth validates credentials
        │
        ▼
3. Supabase issues JWT access token + refresh token in secure cookies
        │
        ▼
4. Direct Database Queries:
   - Client sends JWT to Supabase PostgREST
   - PostgreSQL executes Row Level Security (RLS) policies using auth.uid()
        │
        ▼
5. Backend (FastAPI) Calls:
   - Client passes Supabase JWT in Authorization header: Bearer <JWT>
   - FastAPI verifies Supabase JWT via public key / Supabase JWT Secret
```

### Data Privacy Rules

| Data | Private Project | Public Project |
|------|----------------|----------------|
| Plot coordinates (exact) | Members only | Adopters + Public |
| Plot polygon | Members only | Simplified/buffered for public |
| Field monitoring data | Members only | Summary stats only for public |
| Photos | Members only | Selected photos for public |
| Satellite data | Members only | Charts for public |
| Observer identity | Members only | Never public |
| Adopter identity | Members only | Optional (adopter controls) |

### Photo Security
1. Strip EXIF GPS metadata dari foto sebelum dipindahkan ke bucket `public-photos`
2. Bucket `monitoring-photos` private — hanya bisa diakses oleh authenticated project members via Storage RLS
3. Client-side image compression (max 2048px, quality 80%) sebelum upload
4. File type check (JPG, JPEG, PNG, WebP)

---

## 7. Photo Management (Supabase Storage)

### Upload Flow

```
1. Client: capture/select photo
        │
        ▼
2. Client: EXIF extraction (timestamp, GPS)
        │
        ▼
3. Client: resize + compress (max 2048px, quality 80%)
        │
        ▼
4. If online: upload to Supabase Storage ('monitoring-photos')
   If offline: store in IndexedDB as blob
        │
        ▼
5. Client: Insert photo record to public.photos table
        │
        ▼
6. For public display: FastAPI background worker copies to 'public-photos' with GPS EXIF stripped
```

### Storage Buckets Structure
```
monitoring-photos/ (Private)
  /{project_id}/{plot_id}/{monitoring_id}/{photo_id}.jpg

public-photos/ (Public)
  /{project_id}/{plot_id}/{photo_id}_display.jpg
  /{project_id}/{plot_id}/{photo_id}_thumb.jpg
```

---

## 8. Background Processing (Celery)

### Task Types

| Task | Trigger | Priority | Timeout |
|------|---------|----------|---------|
| `analyze_plot_satellite` | User request | Medium | 5 min |
| `batch_analyze_project` | Scheduled / manual | Low | 30 min |
| `generate_time_series` | After satellite analysis | Medium | 2 min |
| `strip_exif_public_photo` | After upload | High | 1 min |
| `send_monitoring_reminder` | Cron schedule | Low | 30 sec |
| `calculate_plot_status` | After monitoring / satellite | Medium | 1 min |
| `generate_export` | User request | Low | 10 min |

### Scheduled Tasks (Cron)

| Schedule | Task | Description |
|----------|------|-------------|
| Daily 06:00 WIB | `check_monitoring_due` | Kirim reminder jika monitoring overdue |
| Weekly Sunday | `batch_satellite_update` | Update satellite data semua active plots |
| Monthly 1st | `recalculate_all_status` | Recalculate semua plot status |

---

## 9. Export & Interoperability

### Export Formats

| Format | Data | Use Case |
|--------|------|----------|
| **GeoJSON** | Plot polygons + attributes | GIS software import |
| **Shapefile** | Plot polygons + attributes | Legacy GIS compatibility |
| **CSV** | Monitoring data, satellite data | Spreadsheet analysis |
| **Excel (.xlsx)** | Dashboard reports | Formal reporting |
| **PDF** | Project report, impact report | Print/email distribution |

---

## 10. Deployment (Supabase Cloud + Docker)

### Cloud Infrastructure
- **Database, Auth, Storage:** Managed directly on **Supabase Cloud (Singapore `ap-southeast-1`)**
- **Frontend & FastAPI Service:** Run locally / deployed via Docker Compose

### Docker Services (Simplified)

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
      - REDIS_URL=redis://redis:6379/0
      - GEE_SERVICE_ACCOUNT_EMAIL=${GEE_SERVICE_ACCOUNT_EMAIL}
      - GEE_PRIVATE_KEY_JSON=${GEE_PRIVATE_KEY_JSON}
    depends_on:
      - redis
    
  celery-worker:
    build: ./backend
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379/0
      - GEE_SERVICE_ACCOUNT_EMAIL=${GEE_SERVICE_ACCOUNT_EMAIL}
      - GEE_PRIVATE_KEY_JSON=${GEE_PRIVATE_KEY_JSON}
    depends_on:
      - redis
    
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Backend (.env)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret-from-supabase-dashboard>
REDIS_URL=redis://localhost:6379/0

# Google Earth Engine
GEE_SERVICE_ACCOUNT_EMAIL=rehabtrack@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_JSON=<base64-encoded-key>

# App Config
APP_ENV=development
CORS_ORIGINS=http://localhost:3000,https://rehabtrack.id
```

---

## 11. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| API response time (p95) | < 500ms | Excluding GEE calls |
| GEE analysis time | < 60s per plot | Single plot, single period |
| Photo upload time | < 5s per photo | After compression |
| Map render (100 plots) | < 2s | Initial load |
| Dashboard load | < 3s | With cached data |
| Offline form submission | < 1s | Local storage |
| Sync queue processing | < 30s per item | Including photo upload |

---

## 12. Monitoring & Observability

| Component | Tool | Monitors |
|-----------|------|----------|
| Error tracking | Sentry | Exceptions, crashes |
| API metrics | Prometheus + Grafana | Latency, throughput, error rate |
| Application logs | Structured JSON logs | Request logs, GEE processing |
| Uptime | UptimeRobot / Healthcheck | API availability |
| Database | pg_stat_statements | Slow queries |
| GEE jobs | Celery Flower | Task queue status |

---

*END OF TECHNICAL SPECIFICATION*
