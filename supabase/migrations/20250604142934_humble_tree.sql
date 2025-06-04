/*
  # Update AI Model ID

  1. Changes
    - Update the model_id for Claude in the ai_models table from 'anthropic/claude-4' to 'anthropic/claude-opus-4'
    
  2. Reason
    - The current model ID is invalid according to OpenRouter API
    - The correct model ID is 'anthropic/claude-opus-4' as per OpenRouter documentation
*/

DO $$ 
BEGIN
  UPDATE ai_models 
  SET model_id = 'anthropic/claude-opus-4',
      updated_at = now()
  WHERE model_id = 'anthropic/claude-4';
END $$;