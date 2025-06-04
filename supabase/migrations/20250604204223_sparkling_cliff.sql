/*
  # Fix validation prompt and AI model configuration

  1. Changes
    - Updates existing AI model record if it exists
    - Updates validation prompt with improved content
    - Ensures consistent model_id usage

  2. Security
    - No changes to security policies
*/

DO $$ 
BEGIN
  -- Update existing AI model if it exists
  UPDATE ai_models 
  SET name = 'GPT-3.5 Turbo',
      description = 'OpenAI GPT-3.5 Turbo model for workflow validation'
  WHERE model_id = 'openai/gpt-3.5-turbo';

  -- Insert only if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM ai_models WHERE model_id = 'openai/gpt-3.5-turbo') THEN
    INSERT INTO ai_models (name, model_id, description)
    VALUES (
      'GPT-3.5 Turbo',
      'openai/gpt-3.5-turbo',
      'OpenAI GPT-3.5 Turbo model for workflow validation'
    );
  END IF;
END $$;

-- Update the validation prompt
INSERT INTO system_prompts (step, prompt, ai_model_id, is_active)
VALUES (
  'validation',
  'You are a workflow validation expert. Your task is to validate if the given workflow description can be broken down into three components: trigger, process, and action.

Rules for validation:
1. Trigger must describe an event that starts the workflow (e.g., "When a new email arrives")
2. Process must describe what needs to be done with the data (e.g., "Extract the sender and subject")
3. Action must describe the final outcome (e.g., "Save to database")

Respond with a JSON object containing:
{
  "isValid": boolean,
  "feedback": string (only if invalid),
  "components": {
    "trigger": string,
    "process": string,
    "action": string
  }
}

Example valid input:
"When a new customer signs up, check their email domain, and add them to the appropriate mailing list"

Example response:
{
  "isValid": true,
  "components": {
    "trigger": "When a new customer signs up",
    "process": "Check their email domain",
    "action": "Add them to the appropriate mailing list"
  }
}',
  (SELECT id FROM ai_models WHERE model_id = 'openai/gpt-3.5-turbo'),
  true
) ON CONFLICT (step) DO UPDATE 
SET prompt = EXCLUDED.prompt,
    ai_model_id = EXCLUDED.ai_model_id,
    is_active = EXCLUDED.is_active;