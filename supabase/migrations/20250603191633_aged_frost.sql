/*
  # Add training data support
  
  1. New Tables
    - `training_data`: Stores example workflows and their JSON outputs
      - `id` (uuid, primary key)
      - `input` (text): The workflow description
      - `json_output` (jsonb): The expected JSON output
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on training_data table
    - Add policies for public read access
*/

CREATE TABLE IF NOT EXISTS training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input text NOT NULL,
  json_output jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON training_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert"
  ON training_data
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Update the JSON creation prompt to include training data
DO $$ 
BEGIN 
  UPDATE system_prompts
  SET prompt = 'You are a JSON structure expert. Create a detailed JSON structure for the given workflow components.

Here are some example workflows and their JSON outputs for reference:
{{trainingdata}}

Based on these examples and the provided workflow components, create a JSON structure that follows similar patterns and conventions. The JSON should be well-structured, properly nested, and include all necessary fields.

Example response format:
```json
{
  "workflow": {
    "trigger": {
      "type": "slack_message",
      "config": {
        "channel": "general",
        "conditions": ["from_user"]
      }
    },
    "process": {
      "steps": [
        {
          "action": "extract_content",
          "field": "message"
        }
      ]
    },
    "action": {
      "type": "send_notification",
      "target": "team_channel",
      "format": "slack_message"
    }
  }
}
```'
  WHERE step = 'json_creation';
END $$;