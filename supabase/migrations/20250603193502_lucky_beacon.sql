/*
  # Add metadata prompt for workflow metadata generation

  1. Changes
    - Add new system prompt for metadata generation step
    - Links to existing AI model
    - Enables workflow title and description generation

  2. Details
    - Creates a new entry in system_prompts table
    - Sets step to 'metadata'
    - Provides prompt for generating workflow metadata
    - Links to first available AI model
*/

DO $$ 
DECLARE
  first_model_id uuid;
BEGIN
  -- Get the first available AI model ID
  SELECT id INTO first_model_id FROM ai_models LIMIT 1;

  -- Insert the metadata prompt if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM system_prompts WHERE step = 'metadata'
  ) THEN
    INSERT INTO system_prompts (step, prompt, ai_model_id)
    VALUES (
      'metadata',
      'Based on the workflow description, generate a JSON object containing a concise title and description for the workflow. The response should be in this format: {"title": "Brief, clear title", "description": "Concise description of what the workflow does"}. Keep both the title and description professional and focused on the workflow''s purpose.',
      first_model_id
    );
  END IF;
END $$;