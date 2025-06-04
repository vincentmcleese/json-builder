/*
  # Update AI Model ID

  1. Changes
    - Update the model_id for the existing AI model from 'google/gemini-pro' to 'google/gemini-pro-1.5-pro'
    
  2. Notes
    - This migration safely updates the model ID to a valid OpenRouter model
    - Uses a DO block to ensure the update only happens if the old model ID exists
*/

DO $$ 
BEGIN 
  UPDATE ai_models
  SET model_id = 'google/gemini-pro-1.5-pro',
      updated_at = now()
  WHERE model_id = 'google/gemini-pro';
END $$;