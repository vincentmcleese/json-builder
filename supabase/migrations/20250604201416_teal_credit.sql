/*
  # Add validation prompt and AI model

  1. New Data
    - Add entry to `ai_models` table for validation model
    - Add validation prompt to `system_prompts` table
  
  2. Changes
    - Ensures validation prompt exists with proper AI model association
*/

-- First, add the AI model if it doesn't exist
INSERT INTO ai_models (name, model_id, description)
VALUES (
  'GPT-3.5 Turbo',
  'openai/gpt-3.5-turbo',
  'OpenAI GPT-3.5 Turbo model for workflow validation'
)
ON CONFLICT (model_id) DO NOTHING;

-- Then add the validation prompt
INSERT INTO system_prompts (step, prompt, ai_model_id)
VALUES (
  'validation',
  'You are a workflow validation assistant. Your task is to validate if the given workflow description can be broken down into three components: trigger, process, and action. Analyze the input and return a JSON response with the following structure:
  {
    "isValid": boolean,
    "feedback": string,
    "components": {
      "trigger": string,
      "process": string,
      "action": string
    }
  }
  
  If the workflow is valid, set isValid to true and populate the components. If not, set isValid to false and provide helpful feedback.',
  (SELECT id FROM ai_models WHERE model_id = 'openai/gpt-3.5-turbo')
)
ON CONFLICT DO NOTHING;