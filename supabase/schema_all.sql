-- REHABTRACK — Complete Supabase Cloud Setup Script (All-in-One)
-- You can run this entire script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. EXTENSIONS & ENUMS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'PROJECT_MANAGER', 'FIELD_OFFICER', 'VIEWER', 'ADOPTER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE project_visibility AS ENUM ('PUBLIC', 'PRIVATE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE rehabilitation_type AS ENUM (
        'REFORESTATION', 'AGROFORESTRY', 'MANGROVE_RESTORATION',
        'RIPARIAN_RESTORATION', 'MINE_RECLAMATION', 'WATERSHED_REHABILITATION', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE monitoring_status AS ENUM ('RECOVERING', 'MONITORING', 'AT_RISK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE plant_condition AS ENUM ('HEALTHY', 'STRESSED', 'DEAD', 'MISSING', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE species_category AS ENUM ('TREE', 'SHRUB', 'GRASS', 'MANGROVE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE intervention_type AS ENUM ('PLANTING', 'REPLANTING', 'MAINTENANCE', 'FERTILIZATION', 'WATERING', 'PEST_CONTROL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('PENDING', 'SYNCED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE quality_flag AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE adoption_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE update_type AS ENUM ('PROJECT_STORY', 'FOREST_JOURNAL', 'MONITORING_UPDATE', 'IMPACT_REPORT', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE project_member_role AS ENUM ('MANAGER', 'FIELD_OFFICER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. TABLES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    role            user_role NOT NULL DEFAULT 'VIEWER',
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE TABLE IF NOT EXISTS public.projects (
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
CREATE INDEX IF NOT EXISTS idx_projects_manager ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(visibility);

CREATE TABLE IF NOT EXISTS public.project_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role        project_member_role NOT NULL DEFAULT 'VIEWER',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);

CREATE TABLE IF NOT EXISTS public.plots (
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
CREATE INDEX IF NOT EXISTS idx_plots_project ON public.plots(project_id);
CREATE INDEX IF NOT EXISTS idx_plots_geom ON public.plots USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_plots_status ON public.plots(monitoring_status);

CREATE TABLE IF NOT EXISTS public.species (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    common_name     VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    category        species_category NOT NULL DEFAULT 'TREE',
    native          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_species_name ON public.species(common_name);

CREATE TABLE IF NOT EXISTS public.planting_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id     UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    species_id  UUID NOT NULL REFERENCES public.species(id),
    date        DATE NOT NULL,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_planting_events_plot ON public.planting_events(plot_id);
CREATE INDEX IF NOT EXISTS idx_planting_events_date ON public.planting_events(date);

CREATE TABLE IF NOT EXISTS public.field_monitorings (
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
CREATE INDEX IF NOT EXISTS idx_field_monitorings_plot ON public.field_monitorings(plot_id);
CREATE INDEX IF NOT EXISTS idx_field_monitorings_date ON public.field_monitorings(date);
CREATE INDEX IF NOT EXISTS idx_field_monitorings_observer ON public.field_monitorings(observer_id);
CREATE INDEX IF NOT EXISTS idx_field_monitorings_geom ON public.field_monitorings USING GIST(geom);

CREATE TABLE IF NOT EXISTS public.photos (
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
CREATE INDEX IF NOT EXISTS idx_photos_monitoring ON public.photos(monitoring_id);

CREATE TABLE IF NOT EXISTS public.interventions (
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
CREATE INDEX IF NOT EXISTS idx_interventions_plot ON public.interventions(plot_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON public.interventions(date);
CREATE INDEX IF NOT EXISTS idx_interventions_type ON public.interventions(type);

CREATE TABLE IF NOT EXISTS public.satellite_observations (
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
CREATE INDEX IF NOT EXISTS idx_satellite_obs_plot ON public.satellite_observations(plot_id);
CREATE INDEX IF NOT EXISTS idx_satellite_obs_date ON public.satellite_observations(observation_date);

CREATE TABLE IF NOT EXISTS public.adoptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id         UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    supporter_id    UUID NOT NULL REFERENCES public.users(id),
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE,
    status          adoption_status NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_adoptions_plot ON public.adoptions(plot_id);

CREATE TABLE IF NOT EXISTS public.project_updates (
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

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'VIEWER'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION calculate_plot_area()
RETURNS TRIGGER AS $$
BEGIN
    NEW.area_m2 := ST_Area(NEW.geom::geography);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_plot_area ON public.plots;
CREATE TRIGGER trg_calculate_plot_area
    BEFORE INSERT OR UPDATE OF geom ON public.plots
    FOR EACH ROW EXECUTE FUNCTION calculate_plot_area();

CREATE OR REPLACE FUNCTION calculate_quality_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cloud_cover_pct > 30 OR NEW.valid_pixel_pct < 70 THEN
        NEW.quality_flag := 'LOW';
    ELSIF NEW.cloud_cover_pct > 15 OR NEW.valid_pixel_pct < 85 THEN
        NEW.quality_flag := 'MEDIUM';
    ELSE
        NEW.quality_flag := 'HIGH';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quality_flag ON public.satellite_observations;
CREATE TRIGGER trg_quality_flag
    BEFORE INSERT OR UPDATE ON public.satellite_observations
    FOR EACH ROW EXECUTE FUNCTION calculate_quality_flag();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_monitorings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satellite_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
    CREATE POLICY "users_select_authenticated" ON public.users FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "users_update_own" ON public.users;
    CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

    DROP POLICY IF EXISTS "projects_select" ON public.projects;
    CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (
        visibility = 'PUBLIC'
        OR auth.uid() = manager_id
        OR id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
    );

    DROP POLICY IF EXISTS "projects_insert" ON public.projects;
    CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = manager_id);

    DROP POLICY IF EXISTS "projects_update" ON public.projects;
    CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (
        auth.uid() = manager_id
        OR id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role = 'MANAGER')
    );

    DROP POLICY IF EXISTS "plots_select" ON public.plots;
    CREATE POLICY "plots_select" ON public.plots FOR SELECT USING (
        project_id IN (SELECT id FROM public.projects WHERE visibility = 'PUBLIC')
        OR project_id IN (SELECT id FROM public.projects WHERE manager_id = auth.uid())
        OR project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
    );

    DROP POLICY IF EXISTS "plots_insert" ON public.plots;
    CREATE POLICY "plots_insert" ON public.plots FOR INSERT TO authenticated WITH CHECK (
        project_id IN (SELECT id FROM public.projects WHERE manager_id = auth.uid())
        OR project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role = 'MANAGER')
    );

    DROP POLICY IF EXISTS "plots_update" ON public.plots;
    CREATE POLICY "plots_update" ON public.plots FOR UPDATE TO authenticated USING (
        project_id IN (SELECT id FROM public.projects WHERE manager_id = auth.uid())
        OR project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role = 'MANAGER')
    );

    DROP POLICY IF EXISTS "species_select" ON public.species;
    CREATE POLICY "species_select" ON public.species FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "species_insert" ON public.species;
    CREATE POLICY "species_insert" ON public.species FOR INSERT TO authenticated WITH CHECK (true);

    DROP POLICY IF EXISTS "monitorings_select" ON public.field_monitorings;
    CREATE POLICY "monitorings_select" ON public.field_monitorings FOR SELECT USING (
        plot_id IN (SELECT p.id FROM public.plots p JOIN public.projects pr ON pr.id = p.project_id WHERE pr.visibility = 'PUBLIC' OR pr.manager_id = auth.uid() OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid()))
    );

    DROP POLICY IF EXISTS "monitorings_insert" ON public.field_monitorings;
    CREATE POLICY "monitorings_insert" ON public.field_monitorings FOR INSERT TO authenticated WITH CHECK (
        plot_id IN (SELECT p.id FROM public.plots p JOIN public.projects pr ON pr.id = p.project_id WHERE pr.manager_id = auth.uid() OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role IN ('MANAGER', 'FIELD_OFFICER')))
    );

    DROP POLICY IF EXISTS "photos_select" ON public.photos;
    CREATE POLICY "photos_select" ON public.photos FOR SELECT USING (true);

    DROP POLICY IF EXISTS "photos_insert" ON public.photos;
    CREATE POLICY "photos_insert" ON public.photos FOR INSERT TO authenticated WITH CHECK (
        monitoring_id IN (SELECT id FROM public.field_monitorings WHERE observer_id = auth.uid())
    );
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. STORAGE BUCKETS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('monitoring-photos', 'monitoring-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('public-photos', 'public-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    DROP POLICY IF EXISTS "upload_monitoring_photos" ON storage.objects;
    CREATE POLICY "upload_monitoring_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'monitoring-photos');

    DROP POLICY IF EXISTS "view_monitoring_photos" ON storage.objects;
    CREATE POLICY "view_monitoring_photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'monitoring-photos');

    DROP POLICY IF EXISTS "view_public_photos" ON storage.objects;
    CREATE POLICY "view_public_photos" ON storage.objects FOR SELECT USING (bucket_id = 'public-photos');
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. RPC FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_project_kpi(p_project_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_area_ha', ROUND(COALESCE(SUM(area_m2) / 10000, 0)::NUMERIC, 2),
        'total_plots', COUNT(*),
        'total_planted', (
            SELECT COALESCE(SUM(pe.quantity), 0)
            FROM public.planting_events pe
            JOIN public.plots pl ON pe.plot_id = pl.id
            WHERE pl.project_id = p_project_id
        ),
        'total_monitorings', (
            SELECT COUNT(*)
            FROM public.field_monitorings fm
            JOIN public.plots pl ON fm.plot_id = pl.id
            WHERE pl.project_id = p_project_id
        ),
        'avg_survival_rate', ROUND((
            SELECT COALESCE(AVG(fm.survival_rate), 0)
            FROM public.field_monitorings fm
            JOIN public.plots pl ON fm.plot_id = pl.id
            WHERE pl.project_id = p_project_id
            AND fm.id IN (
                SELECT DISTINCT ON (plot_id) id
                FROM public.field_monitorings
                ORDER BY plot_id, date DESC
            )
        )::NUMERIC, 1),
        'plots_recovering', COUNT(*) FILTER (WHERE monitoring_status = 'RECOVERING'),
        'plots_monitoring', COUNT(*) FILTER (WHERE monitoring_status = 'MONITORING'),
        'plots_at_risk', COUNT(*) FILTER (WHERE monitoring_status = 'AT_RISK')
    ) INTO result
    FROM public.plots
    WHERE project_id = p_project_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_system_overview()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_projects', (SELECT COUNT(*) FROM public.projects),
        'total_plots', (SELECT COUNT(*) FROM public.plots),
        'total_area_ha', ROUND((SELECT COALESCE(SUM(area_m2) / 10000, 0) FROM public.plots)::NUMERIC, 2),
        'total_planted', (SELECT COALESCE(SUM(quantity), 0) FROM public.planting_events),
        'total_monitorings', (SELECT COUNT(*) FROM public.field_monitorings),
        'avg_survival_rate', ROUND((
            SELECT COALESCE(AVG(survival_rate), 0)
            FROM public.field_monitorings
            WHERE id IN (
                SELECT DISTINCT ON (plot_id) id
                FROM public.field_monitorings
                ORDER BY plot_id, date DESC
            )
        )::NUMERIC, 1),
        'plots_recovering', (SELECT COUNT(*) FROM public.plots WHERE monitoring_status = 'RECOVERING'),
        'plots_monitoring', (SELECT COUNT(*) FROM public.plots WHERE monitoring_status = 'MONITORING'),
        'plots_at_risk', (SELECT COUNT(*) FROM public.plots WHERE monitoring_status = 'AT_RISK')
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. SEED INITIAL SPECIES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.species (common_name, scientific_name, category, native) VALUES
    ('Sengon', 'Falcataria moluccana', 'TREE', true),
    ('Trembesi', 'Samanea saman', 'TREE', false),
    ('Mahoni', 'Swietenia macrophylla', 'TREE', false),
    ('Jati', 'Tectona grandis', 'TREE', true),
    ('Merbau', 'Intsia bijuga', 'TREE', true),
    ('Cempaka', 'Magnolia champaca', 'TREE', true),
    ('Damar', 'Agathis dammara', 'TREE', true),
    ('Gmelina / Jati Putih', 'Gmelina arborea', 'TREE', false),
    ('Beringin', 'Ficus benjamina', 'TREE', true),
    ('Nyamplung', 'Calophyllum inophyllum', 'TREE', true),
    ('Bakau Kurap', 'Rhizophora mucronata', 'MANGROVE', true),
    ('Bakau Minyak', 'Rhizophora apiculata', 'MANGROVE', true),
    ('Api-api Putih', 'Avicennia marina', 'MANGROVE', true),
    ('Pedada', 'Sonneratia alba', 'MANGROVE', true),
    ('Kaliandra', 'Calliandra calothyrsus', 'SHRUB', false),
    ('Rumput Vetiver', 'Chrysopogon zizanioides', 'GRASS', true)
ON CONFLICT DO NOTHING;
