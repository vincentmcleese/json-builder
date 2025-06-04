/*
  # Add validation prompt

  1. Changes
    - Insert validation prompt into system_prompts table
    - Insert required AI model for validation
    - Link validation prompt to AI model

  2. Details
    - Creates a new AI model for validation
    - Adds validation prompt with step='validation'
    - Associates prompt with AI model
*/

-- First, insert the AI model
INSERT INTO ai_models (name, model_id, description)
VALUES (
  'GPT-3.5 Turbo',
  'openai/gpt-3.5-turbo',
  'OpenAI GPT-3.5 Turbo model for workflow validation'
)
ON CONFLICT (model_id) DO NOTHING;

-- Then, insert the validation prompt
INSERT INTO system_prompts (step, prompt, ai_model_id)
VALUES (
  'validation',
  'You are a workflow validation assistant. Your task is to validate if the given workflow description can be broken down into three components: trigger, process, and action.

  Analyze the input and return a JSON object with the following structure:
  {
    "isValid": boolean,
    "feedback": string,
    "components": {
      "trigger": string,
      "process": string,
      "action": string
    }
  }

  Rules:
  1. The workflow must have a clear trigger (when something happens)
  2. The workflow must have a clear process (what needs to be checked/done)
  3. The workflow must have a clear action (final result)
  4. Each component should be a clear, concise statement
  
  If valid, set isValid to true and populate the components.
  If invalid, set isValid to false and provide helpful feedback.',
  (SELECT id FROM ai_models WHERE model_id = 'openai/gpt-3.5-turbo')
)
ON CONFLICT DO NOTHING;