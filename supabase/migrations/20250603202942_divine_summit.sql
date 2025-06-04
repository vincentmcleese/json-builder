/*
  # Add Gemini 2.5 Pro model

  1. Changes
    - Add unique constraint on model_id column
    - Insert Gemini 2.5 Pro model
*/

-- First, add a unique constraint on model_id
ALTER TABLE ai_models
ADD CONSTRAINT ai_models_model_id_key UNIQUE (model_id);

-- Then insert the new model
INSERT INTO ai_models (name, model_id, description)
VALUES (
  'Gemini 2.5 Pro',
  'google/gemini-pro',
  'Google''s most capable model for text generation and analysis'
)
ON CONFLICT (model_id) DO NOTHING;