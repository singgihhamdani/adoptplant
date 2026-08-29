-- 00004_create_rls_policies.sql
-- Row Level Security (RLS) Policies for REHABTRACK

-- Enable RLS on all operational tables
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
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════
-- USERS POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "users_select_authenticated" ON public.users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ═══════════════════════════════════════════
-- PROJECTS POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "projects_select" ON public.projects
    FOR SELECT USING (
        visibility = 'PUBLIC'
        OR auth.uid() = manager_id
        OR id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "projects_insert" ON public.projects
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "projects_update" ON public.projects
    FOR UPDATE TO authenticated USING (
        auth.uid() = manager_id
        OR id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid() AND role = 'MANAGER'
        )
    );

CREATE POLICY "projects_delete" ON public.projects
    FOR DELETE TO authenticated USING (
        auth.uid() = manager_id
        OR id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid() AND role = 'MANAGER'
        )
    );

-- ═══════════════════════════════════════════
-- PROJECT_MEMBERS POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "project_members_select" ON public.project_members
    FOR SELECT TO authenticated USING (
        user_id = auth.uid()
        OR project_id IN (
            SELECT id FROM public.projects WHERE manager_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "project_members_manage" ON public.project_members
    FOR ALL TO authenticated USING (
        project_id IN (
            SELECT id FROM public.projects WHERE manager_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid() AND role = 'MANAGER'
        )
    );

-- ═══════════════════════════════════════════
-- PLOTS POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "plots_select" ON public.plots
    FOR SELECT USING (
        project_id IN (SELECT id FROM public.projects WHERE visibility = 'PUBLIC')
        OR project_id IN (
            SELECT id FROM public.projects WHERE manager_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "plots_insert" ON public.plots
    FOR INSERT TO authenticated WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects WHERE manager_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid() AND role = 'MANAGER'
        )
    );

CREATE POLICY "plots_update" ON public.plots
    FOR UPDATE TO authenticated USING (
        project_id IN (
            SELECT id FROM public.projects WHERE manager_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid() AND role = 'MANAGER'
        )
    );

CREATE POLICY "plots_delete" ON public.plots
    FOR DELETE TO authenticated USING (
        project_id IN (
            SELECT id FROM public.projects WHERE manager_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid() AND role = 'MANAGER'
        )
    );

-- ═══════════════════════════════════════════
-- SPECIES POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "species_select" ON public.species
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "species_insert" ON public.species
    FOR INSERT TO authenticated WITH CHECK (true);

-- ═══════════════════════════════════════════
-- PLANTING_EVENTS POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "planting_events_select" ON public.planting_events
    FOR SELECT USING (
        plot_id IN (
            SELECT p.id FROM public.plots p
            JOIN public.projects pr ON pr.id = p.project_id
            WHERE pr.visibility = 'PUBLIC' OR pr.manager_id = auth.uid()
            OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "planting_events_insert" ON public.planting_events
    FOR INSERT TO authenticated WITH CHECK (
        plot_id IN (
            SELECT p.id FROM public.plots p
            JOIN public.projects pr ON pr.id = p.project_id
            WHERE pr.manager_id = auth.uid()
            OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role IN ('MANAGER', 'FIELD_OFFICER'))
        )
    );

-- ═══════════════════════════════════════════
-- FIELD_MONITORINGS & PHOTOS POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "monitorings_select" ON public.field_monitorings
    FOR SELECT USING (
        plot_id IN (
            SELECT p.id FROM public.plots p
            JOIN public.projects pr ON pr.id = p.project_id
            WHERE pr.visibility = 'PUBLIC' OR pr.manager_id = auth.uid()
            OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "monitorings_insert" ON public.field_monitorings
    FOR INSERT TO authenticated WITH CHECK (
        plot_id IN (
            SELECT p.id FROM public.plots p
            JOIN public.projects pr ON pr.id = p.project_id
            WHERE pr.manager_id = auth.uid()
            OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role IN ('MANAGER', 'FIELD_OFFICER'))
        )
    );

CREATE POLICY "photos_select" ON public.photos
    FOR SELECT USING (
        monitoring_id IN (SELECT id FROM public.field_monitorings)
    );

CREATE POLICY "photos_insert" ON public.photos
    FOR INSERT TO authenticated WITH CHECK (
        monitoring_id IN (SELECT id FROM public.field_monitorings WHERE observer_id = auth.uid())
    );

-- ═══════════════════════════════════════════
-- INTERVENTIONS POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "interventions_select" ON public.interventions
    FOR SELECT USING (
        plot_id IN (
            SELECT p.id FROM public.plots p
            JOIN public.projects pr ON pr.id = p.project_id
            WHERE pr.visibility = 'PUBLIC' OR pr.manager_id = auth.uid()
            OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "interventions_insert" ON public.interventions
    FOR INSERT TO authenticated WITH CHECK (
        plot_id IN (
            SELECT p.id FROM public.plots p
            JOIN public.projects pr ON pr.id = p.project_id
            WHERE pr.manager_id = auth.uid()
            OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role IN ('MANAGER', 'FIELD_OFFICER'))
        )
    );

-- ═══════════════════════════════════════════
-- SATELLITE_OBSERVATIONS POLICIES
-- ═══════════════════════════════════════════
CREATE POLICY "satellite_obs_select" ON public.satellite_observations
    FOR SELECT USING (
        plot_id IN (
            SELECT p.id FROM public.plots p
            JOIN public.projects pr ON pr.id = p.project_id
            WHERE pr.visibility = 'PUBLIC' OR pr.manager_id = auth.uid()
            OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        )
    );

-- ═══════════════════════════════════════════
-- PROJECT_UPDATES & ADOPTIONS
-- ═══════════════════════════════════════════
CREATE POLICY "project_updates_select" ON public.project_updates
    FOR SELECT USING (true);

CREATE POLICY "project_updates_insert" ON public.project_updates
    FOR INSERT TO authenticated WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects WHERE manager_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role = 'MANAGER'
        )
    );

CREATE POLICY "adoptions_select" ON public.adoptions
    FOR SELECT TO authenticated USING (
        supporter_id = auth.uid()
        OR plot_id IN (
            SELECT p.id FROM public.plots p
            JOIN public.projects pr ON pr.id = p.project_id
            WHERE pr.manager_id = auth.uid()
            OR p.project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        )
    );
