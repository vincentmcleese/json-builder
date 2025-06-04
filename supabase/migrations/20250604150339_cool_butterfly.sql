/*
  # Add user ownership to workflows

  1. Changes
    - Add user_id column to workflows table
    - Update RLS policies for user-based access control
    - Handle existing workflows
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Maintain public read access
*/

-- Add user_id column without NOT NULL constraint initially
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Enable RLS if not already enabled
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow public read access" ON workflows;
DROP POLICY IF EXISTS "Allow public insert" ON workflows;
DROP POLICY IF EXISTS "Allow public update" ON workflows;

-- Create new policies
CREATE POLICY "Users can read any workflow"
  ON workflows
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create own workflows"
  ON workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Handle existing workflows
DO $$
DECLARE
  default_user_id uuid;
BEGIN
  -- Get the first user from auth.users
  SELECT id INTO default_user_id FROM auth.users LIMIT 1;
  
  IF default_user_id IS NULL THEN
    -- If no users exist, create a system user
    INSERT INTO auth.users (id, email)
    VALUES (
      gen_random_uuid(),
      'system@example.com'
    )
    RETURNING id INTO default_user_id;
  END IF;

  -- Update all existing workflows to belong to the default user
  UPDATE workflows 
  SET user_id = default_user_id 
  WHERE user_id IS NULL;
END $$;

-- Now that all existing rows have a user_id, make it required
ALTER TABLE workflows
ALTER COLUMN user_id SET NOT NULL;