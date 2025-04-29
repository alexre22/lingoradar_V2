-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  age INTEGER,
  gender TEXT,
  city TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  native_languages INTEGER[],
  learning_languages INTEGER[],
  interests INTEGER[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, native_languages, learning_languages, interests)
  VALUES (new.id, ARRAY[]::INTEGER[], ARRAY[]::INTEGER[], ARRAY[]::INTEGER[]);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
TO public
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

-- Drop existing user_languages policies if they exist
DROP POLICY IF EXISTS "Users can view their own language preferences" ON user_languages;
DROP POLICY IF EXISTS "Users can insert their own language preferences" ON user_languages;
DROP POLICY IF EXISTS "Users can update their own language preferences" ON user_languages;
DROP POLICY IF EXISTS "Users can delete their own language preferences" ON user_languages;

-- Create policies for user_languages
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

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create policies
CREATE POLICY "Users can view their own messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create index for faster message retrieval
CREATE INDEX IF NOT EXISTS messages_sender_receiver_idx 
  ON public.messages(sender_id, receiver_id);

-- Create index for message ordering
CREATE INDEX IF NOT EXISTS messages_created_at_idx 
  ON public.messages(created_at DESC);

-- Add read_at and delivered_at columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$; 