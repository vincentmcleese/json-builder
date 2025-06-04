/*
  # Add workflow metadata columns

  1. Changes
    - Add `title` column to `workflows` table
    - Add `description` column to `workflows` table
    
  2. Security
    - No changes to RLS policies needed as the existing policies will cover the new columns
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'title'
  ) THEN
    ALTER TABLE workflows ADD COLUMN title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'description'
  ) THEN
    ALTER TABLE workflows ADD COLUMN description text;
  END IF;
END $$;