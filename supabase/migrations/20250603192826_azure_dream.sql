/*
  # Simplify training data structure
  
  1. Changes
    - Drop existing training_data table
    - Create new training_data table with just text content
    - Enable RLS with public read/write access
*/

DROP TABLE IF EXISTS training_data;

CREATE TABLE training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON training_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert"
  ON training_data
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON training_data
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete"
  ON training_data
  FOR DELETE
  TO public
  USING (true);