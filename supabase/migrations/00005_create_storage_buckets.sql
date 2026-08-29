-- 00005_create_storage_buckets.sql
-- Storage buckets and security policies for REHABTRACK photos

-- 1. Create buckets in storage schema
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('monitoring-photos', 'monitoring-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('public-photos', 'public-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for monitoring-photos (Private)
DROP POLICY IF EXISTS "upload_monitoring_photos" ON storage.objects;
CREATE POLICY "upload_monitoring_photos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'monitoring-photos');

DROP POLICY IF EXISTS "view_monitoring_photos" ON storage.objects;
CREATE POLICY "view_monitoring_photos" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'monitoring-photos');

DROP POLICY IF EXISTS "delete_monitoring_photos" ON storage.objects;
CREATE POLICY "delete_monitoring_photos" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'monitoring-photos');

-- 3. Storage Policies for public-photos (Public)
DROP POLICY IF EXISTS "view_public_photos" ON storage.objects;
CREATE POLICY "view_public_photos" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'public-photos');

DROP POLICY IF EXISTS "upload_public_photos" ON storage.objects;
CREATE POLICY "upload_public_photos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'public-photos');
