-- =========================================================
-- WHEELWISE SUPABASE SETUP
-- Run this entire file in Supabase > SQL Editor > New query.
-- First create your admin user in Authentication > Users.
-- After running this SQL, follow README to insert that user's UUID.
-- =========================================================

-- Article table (matches the existing WheelWise frontend fields)
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Automotive News',
    "readTime" TEXT NOT NULL DEFAULT '3 min read',
    image TEXT,
    description TEXT,
    "contentHtml" TEXT,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published')),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    popular BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Admin allow-list. Only the listed Auth user UUID is an administrator.
CREATE TABLE IF NOT EXISTS public.wheelwise_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.wheelwise_admins ENABLE ROW LEVEL SECURITY;

-- Remove the earlier broad/old policy names if present.
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
DROP POLICY IF EXISTS "Public read published articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can read all articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can update articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can read own admin record" ON public.wheelwise_admins;

-- Security-definer helper avoids recursive RLS checks on wheelwise_admins.
CREATE OR REPLACE FUNCTION public.is_wheelwise_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.wheelwise_admins wa
        WHERE wa.user_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.is_wheelwise_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_wheelwise_admin() TO anon, authenticated;

-- Public can see only published articles. Admins can see drafts too.
CREATE POLICY "Public read published articles"
ON public.articles FOR SELECT
TO anon, authenticated
USING (status = 'published' OR public.is_wheelwise_admin());

CREATE POLICY "Admins can insert articles"
ON public.articles FOR INSERT
TO authenticated
WITH CHECK (public.is_wheelwise_admin());

CREATE POLICY "Admins can update articles"
ON public.articles FOR UPDATE
TO authenticated
USING (public.is_wheelwise_admin())
WITH CHECK (public.is_wheelwise_admin());

CREATE POLICY "Admins can delete articles"
ON public.articles FOR DELETE
TO authenticated
USING (public.is_wheelwise_admin());

GRANT SELECT ON public.articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.articles TO authenticated;

-- A user can read only their own allow-list row to confirm admin status.
CREATE POLICY "Admin can read own admin record"
ON public.wheelwise_admins FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));
GRANT SELECT ON public.wheelwise_admins TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.wheelwise_admins FROM anon, authenticated;

-- Create the public image bucket (public URLs are required to display article images).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'wheelwise-images',
    'wheelwise-images',
    TRUE,
    5242880,
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

DROP POLICY IF EXISTS "Public can view WheelWise images" ON storage.objects;
DROP POLICY IF EXISTS "WheelWise admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "WheelWise admins can update images" ON storage.objects;
DROP POLICY IF EXISTS "WheelWise admins can delete images" ON storage.objects;

CREATE POLICY "Public can view WheelWise images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wheelwise-images');

CREATE POLICY "WheelWise admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wheelwise-images' AND public.is_wheelwise_admin());

CREATE POLICY "WheelWise admins can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wheelwise-images' AND public.is_wheelwise_admin())
WITH CHECK (bucket_id = 'wheelwise-images' AND public.is_wheelwise_admin());

CREATE POLICY "WheelWise admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wheelwise-images' AND public.is_wheelwise_admin());

-- IMPORTANT:
-- Create the Auth user first, then run the separate INSERT command
-- shown in README using that user's real UUID. Do not add passwords here.
