/*
  # Add SEO-friendly slugs to workflows

  1. Changes
    - Add `slug` column to workflows table
    - Add unique constraint on slug
    - Add function to generate slugs from titles
    - Add trigger to automatically generate slugs
*/

-- Add slug column
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS slug text;

-- Create function to generate slugs
CREATE OR REPLACE FUNCTION generate_workflow_slug(title text)
RETURNS text AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  new_slug := base_slug;
  
  -- Check for existing slugs and append number if needed
  WHILE EXISTS (SELECT 1 FROM workflows WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate slugs
CREATE OR REPLACE FUNCTION set_workflow_slug()
RETURNS trigger AS $$
BEGIN
  IF NEW.title IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := generate_workflow_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_slug_trigger
BEFORE INSERT OR UPDATE ON workflows
FOR EACH ROW
EXECUTE FUNCTION set_workflow_slug();

-- Add unique constraint
ALTER TABLE workflows
ADD CONSTRAINT workflows_slug_key UNIQUE (slug);

-- Generate slugs for existing workflows
UPDATE workflows
SET slug = generate_workflow_slug(title)
WHERE slug IS NULL OR slug = '';