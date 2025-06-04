/*
  # Update Gemini Model ID

  1. Changes
    - Update the model_id for the Gemini model to use the correct preview version
    
  2. Security
    - No security changes needed as we're only updating existing data
*/

DO $$ 
BEGIN
  UPDATE ai_models
  SET model_id = 'google/gemini-2.5-pro-preview'
  WHERE model_id = 'google/gemini-pro-1.5-pro'
  OR model_id LIKE 'google/gemini%';
END $$;