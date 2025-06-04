/*
  # Add workflow metadata fields
  
  1. Changes
    - Add title field to workflows table
    - Add description field to workflows table
    - Add tool_names array field to store the names of tools used
*/

ALTER TABLE workflows
ADD COLUMN title text,
ADD COLUMN description text,
ADD COLUMN tool_names text[];