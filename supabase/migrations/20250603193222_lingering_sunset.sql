/*
  # Add metadata extraction prompt
  
  1. New Data
    - Add system prompt for extracting workflow metadata
*/

INSERT INTO system_prompts (step, prompt, ai_model_id)
SELECT 
  'metadata',
  'Extract a clear title and description from the workflow description. Return as JSON with "title" and "description" fields. Make the title concise but descriptive, and the description should explain what the workflow does in 1-2 sentences.',
  id
FROM ai_models
WHERE name = 'claude-2' -- or whichever model you prefer
LIMIT 1;