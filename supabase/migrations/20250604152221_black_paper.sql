/*
  # Update users table RLS policies
  
  1. Changes
    - Add insert policy for authenticated users
    - Ensure RLS is enabled
    
  2. Notes
    - Skips existing policies to avoid conflicts
    - Maintains security by requiring auth.uid() match
*/

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add insert policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;