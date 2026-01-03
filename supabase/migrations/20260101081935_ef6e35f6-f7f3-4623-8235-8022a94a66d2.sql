-- Add mobile_number column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number text;

-- Ensure storage buckets exist with proper configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-files', 'meeting-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for meeting-files bucket
CREATE POLICY "Users can upload their own meeting files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own meeting files"
ON storage.objects FOR SELECT
USING (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own meeting files"
ON storage.objects FOR DELETE
USING (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for submissions bucket
CREATE POLICY "Users can upload their own submissions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own submissions"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own submissions"
ON storage.objects FOR DELETE
USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);