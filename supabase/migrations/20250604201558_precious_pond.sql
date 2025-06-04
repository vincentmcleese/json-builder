/*
  # Add validation prompt

  1. Changes
    - Add validation prompt to system_prompts table
    - Add default AI model for validation

  2. New Data
    - Add 'gpt-3.5-turbo' model to ai_models
    - Add validation prompt with appropriate configuration
*/

-- First, ensure we have the AI model
INSERT INTO ai_models (name, model_id, description)
VALUES (
  'GPT-3.5 Turbo',
  'gpt-3.5-turbo',
  'OpenAI GPT-3.5 Turbo model'
) ON CONFLICT (model_id) DO NOTHING;

-- Then add the validation prompt
INSERT INTO system_prompts (step, prompt, ai_model_id, is_active)
VALUES (
  'validation',
  'You are a workflow validation expert. Your task is to validate if the given workflow description can be broken down into three components: trigger, process, and action.

Rules for validation:
1. Trigger must describe an event that starts the workflow
2. Process must describe what needs to be done with the data
3. Action must describe the final outcome

Respond with a JSON object containing:
{
  "isValid": boolean,
  "feedback": string (only if invalid),
  "components": {
    "trigger": string,
    "process": string,
    "action": string
  }
}',
  (SELECT id FROM ai_models WHERE model_id = 'gpt-3.5-turbo'),
  true
) ON CONFLICT DO NOTHING;