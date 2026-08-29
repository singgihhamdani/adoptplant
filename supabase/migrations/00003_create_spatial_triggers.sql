-- 00003_create_spatial_triggers.sql
-- Functions & Triggers for REHABTRACK

-- 1. Auto-create public.users when a new user signs up in Supabase Auth
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

-- 2. Auto-calculate plot area from geometry
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

-- 3. Check monitoring point is within plot boundary
CREATE OR REPLACE FUNCTION check_monitoring_within_plot()
RETURNS TRIGGER AS $$
DECLARE
    plot_polygon geometry;
BEGIN
    SELECT geom INTO plot_polygon FROM public.plots WHERE id = NEW.plot_id;
    IF plot_polygon IS NOT NULL AND NOT ST_Within(NEW.geom, plot_polygon) THEN
        RAISE EXCEPTION 'Monitoring point coordinates must be inside the plot boundary';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_monitoring_within_plot ON public.field_monitorings;
CREATE TRIGGER trg_monitoring_within_plot
    BEFORE INSERT OR UPDATE OF geom ON public.field_monitorings
    FOR EACH ROW EXECUTE FUNCTION check_monitoring_within_plot();

-- 4. Check coordinates are within Indonesia bounding box
CREATE OR REPLACE FUNCTION check_indonesia_bounds()
RETURNS TRIGGER AS $$
DECLARE
    centroid geometry;
    lat DECIMAL;
    lon DECIMAL;
BEGIN
    centroid := ST_Centroid(NEW.geom);
    lat := ST_Y(centroid);
    lon := ST_X(centroid);
    IF lat < -11.5 OR lat > 6.5 OR lon < 94.5 OR lon > 141.5 THEN
        RAISE EXCEPTION 'Coordinates (% , %) are outside Indonesia bounds', lat, lon;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plot_indonesia_bounds ON public.plots;
CREATE TRIGGER trg_plot_indonesia_bounds
    BEFORE INSERT OR UPDATE OF geom ON public.plots
    FOR EACH ROW EXECUTE FUNCTION check_indonesia_bounds();

-- 5. Auto-calculate quality flag for satellite observations
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
