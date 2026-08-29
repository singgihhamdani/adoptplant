-- 00006_create_rpc_functions.sql
-- PostgreSQL functions (Supabase RPC) for high-performance aggregations

-- 1. Get Project KPI Summary
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

-- 2. Get Global System Overview KPI
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
