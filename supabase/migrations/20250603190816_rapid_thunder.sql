/*
  # Add tools table and update system prompts

  1. New Tables
    - `tools`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `type` (text) - can be 'trigger', 'process', or 'action'
      - `description` (text)
      - `icon` (text) - URL to the tool's icon
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Update `workflows` table to include tool references
    - Add foreign key constraints

  3. Security
    - Enable RLS on `tools` table
    - Add policy for public read access
*/

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('trigger', 'process', 'action')),
  description text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add tool reference columns to workflows
ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS trigger_tool_id uuid REFERENCES tools(id),
ADD COLUMN IF NOT EXISTS process_tool_id uuid REFERENCES tools(id),
ADD COLUMN IF NOT EXISTS action_tool_id uuid REFERENCES tools(id);

-- Enable RLS
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public read access"
  ON tools
  FOR SELECT
  TO public
  USING (true);

-- Insert some common tools
INSERT INTO tools (name, type, description, icon) VALUES
  ('GitHub', 'trigger', 'Trigger on GitHub events', 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'),
  ('Slack', 'trigger', 'Trigger on Slack events', 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png'),
  ('Email', 'trigger', 'Trigger on email events', 'https://www.google.com/gmail/about/static/images/logo-gmail.png'),
  ('Stripe', 'trigger', 'Trigger on payment events', 'https://stripe.com/img/v3/home/twitter-card.png'),
  ('Zapier', 'process', 'Process data with Zapier', 'https://cdn.zapier.com/zapier/images/logos/zapier-logo.png'),
  ('Make', 'process', 'Process data with Make', 'https://images.ctfassets.net/qqlj6g4ee76j/5VrUV4RzB6YM0EkMcKUUMm/3e24ee68f5c0ef22df040b1c00567fe5/Make.com_Logo.png'),
  ('n8n', 'process', 'Process data with n8n', 'https://n8n.io/favicon.ico'),
  ('Discord', 'action', 'Send messages to Discord', 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png'),
  ('Notion', 'action', 'Create or update Notion pages', 'https://www.notion.so/front-static/favicon.ico'),
  ('Airtable', 'action', 'Update Airtable records', 'https://www.airtable.com/favicon.ico');