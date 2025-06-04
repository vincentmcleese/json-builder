/*
  # Update training data names
  
  1. Changes
    - Updates existing training data entries to have meaningful names
    - Ensures name column is required
    
  2. Notes
    - Handles case where name column already exists
    - Sets default names for any entries without names
*/

DO $$ 
BEGIN
  -- Only update entries where name is null (if the column exists)
  UPDATE training_data
  SET name = 'Training Example ' || id::text
  WHERE name IS NULL;

  -- Make name required if it isn't already
  ALTER TABLE training_data
  ALTER COLUMN name SET NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    -- If name column doesn't exist, add it
    ALTER TABLE training_data ADD COLUMN name text;
    
    -- Set default names
    UPDATE training_data
    SET name = 'Training Example ' || id::text
    WHERE name IS NULL;
    
    -- Make it required
    ALTER TABLE training_data
    ALTER COLUMN name SET NOT NULL;
END $$;