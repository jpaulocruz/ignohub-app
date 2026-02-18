-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads
CREATE POLICY "Avatar Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Policy to allow public viewing
CREATE POLICY "Avatar Viewing"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

-- Policy to allow users to update their own avatar
CREATE POLICY "Avatar Updates"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );
