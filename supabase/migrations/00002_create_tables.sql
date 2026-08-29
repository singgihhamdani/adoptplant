-- 00002_create_tables.sql
-- Table definitions for REHABTRACK

-- 1. Users Profile (Linked to Supabase Auth)
CREATE TABLE public.users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    role            user_role NOT NULL DEFAULT 'VIEWER',
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);

-- 2. Projects
CREATE TABLE public.projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    manager_id      UUID NOT NULL REFERENCES public.users(id),
    location_name   VARCHAR(255) NOT NULL,
    province        VARCHAR(100) NOT NULL,
    start_date      DATE NOT NULL,
    target_area_ha  DECIMAL(10,2),
    target_plants   INTEGER,
    status          project_status NOT NULL DEFAULT 'PLANNING',
    visibility      project_visibility NOT NULL DEFAULT 'PRIVATE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_manager ON public.projects(manager_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_visibility ON public.projects(visibility);

-- 3. Project Members
CREATE TABLE public.project_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role        project_member_role NOT NULL DEFAULT 'VIEWER',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);

-- 4. Plots (with PostGIS Geometry)
CREATE TABLE public.plots (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name                  VARCHAR(255) NOT NULL,
    geom                  GEOMETRY(Polygon, 4326) NOT NULL,
    area_m2               DECIMAL(12,2) NOT NULL DEFAULT 0,
    rehabilitation_type   rehabilitation_type NOT NULL,
    baseline_date         DATE NOT NULL,
    baseline_description  TEXT,
    target_plants         INTEGER,
    monitoring_status     monitoring_status NOT NULL DEFAULT 'MONITORING',
    adoptable             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plots_project ON public.plots(project_id);
CREATE INDEX idx_plots_geom ON public.plots USING GIST(geom);
CREATE INDEX idx_plots_status ON public.plots(monitoring_status);

-- 5. Species Catalog
CREATE TABLE public.species (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    common_name     VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    category        species_category NOT NULL DEFAULT 'TREE',
    native          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_species_name ON public.species(common_name);

-- 6. Planting Events
CREATE TABLE public.planting_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id     UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    species_id  UUID NOT NULL REFERENCES public.species(id),
    date        DATE NOT NULL,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_planting_events_plot ON public.planting_events(plot_id);
CREATE INDEX idx_planting_events_date ON public.planting_events(date);

-- 7. Field Monitorings
CREATE TABLE public.field_monitorings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id           UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    date              DATE NOT NULL,
    geom              GEOMETRY(Point, 4326) NOT NULL,
    gps_accuracy_m    DECIMAL(6,2) NOT NULL DEFAULT 10.0,
    healthy_count     INTEGER NOT NULL DEFAULT 0 CHECK (healthy_count >= 0),
    stressed_count    INTEGER NOT NULL DEFAULT 0 CHECK (stressed_count >= 0),
    dead_count        INTEGER NOT NULL DEFAULT 0 CHECK (dead_count >= 0),
    missing_count     INTEGER NOT NULL DEFAULT 0 CHECK (missing_count >= 0),
    survival_rate     DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN (healthy_count + stressed_count + dead_count + missing_count) = 0 THEN NULL
            ELSE (healthy_count::DECIMAL / (healthy_count + stressed_count + dead_count + missing_count)) * 100
        END
    ) STORED,
    avg_height_cm     DECIMAL(8,2) CHECK (avg_height_cm IS NULL OR avg_height_cm > 0),
    avg_diameter_cm   DECIMAL(8,2) CHECK (avg_diameter_cm IS NULL OR avg_diameter_cm > 0),
    canopy_cover_pct  DECIMAL(5,2) CHECK (canopy_cover_pct IS NULL OR (canopy_cover_pct >= 0 AND canopy_cover_pct <= 100)),
    notes             TEXT,
    observer_id       UUID NOT NULL REFERENCES public.users(id),
    sync_status       sync_status NOT NULL DEFAULT 'SYNCED',
    synced_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_field_monitorings_plot ON public.field_monitorings(plot_id);
CREATE INDEX idx_field_monitorings_date ON public.field_monitorings(date);
CREATE INDEX idx_field_monitorings_observer ON public.field_monitorings(observer_id);
CREATE INDEX idx_field_monitorings_geom ON public.field_monitorings USING GIST(geom);

-- 8. Photos
CREATE TABLE public.photos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoring_id   UUID NOT NULL REFERENCES public.field_monitorings(id) ON DELETE CASCADE,
    url             VARCHAR(500) NOT NULL,
    thumbnail_url   VARCHAR(500),
    caption         VARCHAR(500),
    taken_at        TIMESTAMPTZ,
    exif_lat        DECIMAL(10,7),
    exif_lon        DECIMAL(10,7),
    file_size_bytes INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_monitoring ON public.photos(monitoring_id);

-- 9. Interventions
CREATE TABLE public.interventions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id     UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    type        intervention_type NOT NULL,
    quantity    INTEGER CHECK (quantity IS NULL OR quantity > 0),
    description TEXT NOT NULL,
    photo_url   VARCHAR(500),
    created_by  UUID NOT NULL REFERENCES public.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interventions_plot ON public.interventions(plot_id);
CREATE INDEX idx_interventions_date ON public.interventions(date);
CREATE INDEX idx_interventions_type ON public.interventions(type);

-- 10. Satellite Observations
CREATE TABLE public.satellite_observations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id           UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    observation_date  DATE NOT NULL,
    period_start      DATE NOT NULL,
    period_end        DATE NOT NULL,
    ndvi              DECIMAL(6,4) CHECK (ndvi IS NULL OR (ndvi >= -1 AND ndvi <= 1)),
    evi               DECIMAL(6,4) CHECK (evi IS NULL OR (evi >= -1 AND evi <= 1)),
    ndmi              DECIMAL(6,4) CHECK (ndmi IS NULL OR (ndmi >= -1 AND ndmi <= 1)),
    tree_cover_pct    DECIMAL(5,2) CHECK (tree_cover_pct IS NULL OR (tree_cover_pct >= 0 AND tree_cover_pct <= 100)),
    bare_land_pct     DECIMAL(5,2) CHECK (bare_land_pct IS NULL OR (bare_land_pct >= 0 AND bare_land_pct <= 100)),
    vegetation_pct    DECIMAL(5,2) CHECK (vegetation_pct IS NULL OR (vegetation_pct >= 0 AND vegetation_pct <= 100)),
    land_cover_class  VARCHAR(100),
    source_dataset    VARCHAR(255) NOT NULL,
    cloud_cover_pct   DECIMAL(5,2) NOT NULL CHECK (cloud_cover_pct >= 0 AND cloud_cover_pct <= 100),
    valid_pixel_pct   DECIMAL(5,2) NOT NULL CHECK (valid_pixel_pct >= 0 AND valid_pixel_pct <= 100),
    quality_flag      quality_flag NOT NULL DEFAULT 'MEDIUM',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_satellite_obs_plot ON public.satellite_observations(plot_id);
CREATE INDEX idx_satellite_obs_date ON public.satellite_observations(observation_date);
CREATE INDEX idx_satellite_obs_quality ON public.satellite_observations(quality_flag);

-- 11. Adoptions
CREATE TABLE public.adoptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id         UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    supporter_id    UUID NOT NULL REFERENCES public.users(id),
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE,
    status          adoption_status NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adoptions_plot ON public.adoptions(plot_id);
CREATE INDEX idx_adoptions_supporter ON public.adoptions(supporter_id);
CREATE INDEX idx_adoptions_status ON public.adoptions(status);

-- 12. Project Updates
CREATE TABLE public.project_updates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    plot_id     UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    date        DATE NOT NULL,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    update_type update_type NOT NULL DEFAULT 'GENERAL',
    author_id   UUID NOT NULL REFERENCES public.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_updates_project ON public.project_updates(project_id);
CREATE INDEX idx_project_updates_date ON public.project_updates(date);
CREATE INDEX idx_project_updates_type ON public.project_updates(update_type);

-- 13. Audit Logs
CREATE TABLE public.audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.users(id),
    action      VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
