/*
  # Add Claude 4 model

  1. Changes
    - Add Claude 4 to ai_models table
*/

INSERT INTO ai_models (name, model_id, description)
VALUES (
  'Claude 4',
  'anthropic/claude-4',
  'Anthropic''s most advanced model with enhanced reasoning and capabilities'
)
ON CONFLICT (model_id) DO NOTHING;