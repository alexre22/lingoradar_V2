-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  gender TEXT,
  city TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  native_languages INTEGER[],
  learning_languages INTEGER[],
  interests INTEGER[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Create or ignore storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow users to upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view all profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own profile pictures" ON storage.objects;

-- Set up storage policies for profile pictures
CREATE POLICY "Allow users to upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to view all profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Allow users to update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE
);

-- Insert common languages
INSERT INTO languages (name, code) VALUES
('English', 'en'),
('Spanish', 'es'),
('French', 'fr'),
('German', 'de'),
('Italian', 'it'),
('Portuguese', 'pt'),
('Russian', 'ru'),
('Japanese', 'ja'),
('Chinese', 'zh'),
('Korean', 'ko'),
('Arabic', 'ar'),
('Hindi', 'hi')
ON CONFLICT (name) DO NOTHING;

-- Create user_languages table
CREATE TABLE IF NOT EXISTS user_languages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
  is_native BOOLEAN NOT NULL,
  UNIQUE(user_id, language_id, is_native)
);

-- Set up RLS policies for user_languages
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own language preferences"
ON user_languages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own language preferences"
ON user_languages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own language preferences"
ON user_languages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own language preferences"
ON user_languages FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 