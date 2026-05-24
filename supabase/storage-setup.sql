-- ============================================================
-- Dynamic Recipe App - Storage Bucket Setup
-- ============================================================
-- This script configures the Supabase Storage bucket for recipe images.
-- Run this in the Supabase SQL Editor after creating your project.
-- ============================================================

-- ============================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================
-- Create the recipe-images bucket with public access

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recipe-images',
    'recipe-images',
    true,
    5242880, -- 5MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. ENABLE ROW LEVEL SECURITY ON STORAGE OBJECTS
-- ============================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. STORAGE RLS POLICIES
-- ============================================================

-- Policy: Allow anyone to view images (public bucket)
CREATE POLICY "Public Access"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'recipe-images');

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'recipe-images'
        AND auth.role() = 'authenticated'
    );

-- Policy: Allow users to update their own uploaded images
-- Note: This uses the owner field which is automatically set by Supabase
CREATE POLICY "Users can update own images"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'recipe-images'
        AND owner = auth.uid()
    );

-- Policy: Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'recipe-images'
        AND owner = auth.uid()
    );

-- ============================================================
-- 4. COMMENTS
-- ============================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets for the recipe app';
