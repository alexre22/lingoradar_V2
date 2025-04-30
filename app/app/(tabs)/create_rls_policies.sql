-- Enable RLS on the cities table
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all users to select from the cities table
CREATE POLICY "Allow select for all users" ON cities
  FOR SELECT
  USING (true);

-- Grant usage on the table to the anon role
GRANT SELECT ON TABLE cities TO anon; 