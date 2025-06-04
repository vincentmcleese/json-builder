/*
  # Add name field to training data
  
  1. Changes
    - Add name column to training_data table
    - Make name column required
    - Update existing rows with default name
*/

ALTER TABLE training_data
ADD COLUMN name text;

-- Set default names for existing entries
UPDATE training_data
SET name = 'Training Example ' || id::text
WHERE name IS NULL;

-- Make name required
ALTER TABLE training_data
ALTER COLUMN name SET NOT NULL;