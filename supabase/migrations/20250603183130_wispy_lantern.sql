/*
  # Initial Schema Setup

  1. New Tables
    - `ai_models`: Stores available AI models and their configurations
    - `system_prompts`: Stores system prompts for different workflow steps
    - `workflows`: Stores user-created workflows and their JSON outputs
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public access (no auth required)
*/

-- AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model_id text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON ai_models FOR SELECT TO PUBLIC USING (true);

-- System Prompts table
CREATE TABLE IF NOT EXISTS system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step text NOT NULL,
  prompt text NOT NULL,
  ai_model_id uuid REFERENCES ai_models(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON system_prompts FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public insert" ON system_prompts FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "Allow public update" ON system_prompts FOR UPDATE TO PUBLIC USING (true);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_prompt text NOT NULL,
  trigger text NOT NULL,
  process text NOT NULL,
  action text NOT NULL,
  json_output jsonb NOT NULL,
  validation_prompt_id uuid REFERENCES system_prompts(id),
  json_creation_prompt_id uuid REFERENCES system_prompts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON workflows FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public insert" ON workflows FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "Allow public update" ON workflows FOR UPDATE TO PUBLIC USING (true);

-- Insert initial AI models
INSERT INTO ai_models (name, model_id, description) VALUES
  ('GPT-4 Turbo', 'openai/gpt-4-1106-preview', 'Latest GPT-4 model with improved capabilities'),
  ('Claude 2', 'anthropic/claude-2', 'Anthropic''s most capable model'),
  ('Mixtral', 'mistralai/mixtral-8x7b-instruct', 'Mistral''s latest instruction-following model'),
  ('GPT-3.5 Turbo', 'openai/gpt-3.5-turbo', 'Efficient and cost-effective model'),
  ('Claude Instant', 'anthropic/claude-instant-1', 'Fast and efficient model for simple tasks');

-- Insert initial system prompts
INSERT INTO system_prompts (step, prompt, ai_model_id) VALUES
  ('validation', 'You are a workflow validation assistant. Analyze the provided workflow and ensure it contains a clear trigger, process, and action. The trigger should be an event that starts the workflow, the process should describe the transformation or logic, and the action should be the final result. Respond with a JSON object containing "isValid" (boolean), "feedback" (string), and "components" (object with trigger, process, action fields).', (SELECT id FROM ai_models WHERE model_id = 'openai/gpt-4-1106-preview')),
  ('json_creation', 'You are a JSON creation assistant. Based on the provided workflow components (trigger, process, action), create a valid JSON structure that represents this automation workflow. Include all necessary fields and ensure the JSON is properly formatted. Include metadata about the workflow and detailed descriptions for each component.', (SELECT id FROM ai_models WHERE model_id = 'openai/gpt-4-1106-preview'));