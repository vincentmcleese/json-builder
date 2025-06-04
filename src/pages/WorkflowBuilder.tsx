import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/openrouter';
import toast from 'react-hot-toast';

interface Tool {
  id: string;
  name: string;
  type: 'trigger' | 'process' | 'action';
  description: string;
  icon: string;
}

interface WorkflowData {
  trigger: string;
  process: string;
  action: string;
  trigger_tool_id?: string;
  process_tool_id?: string;
  action_tool_id?: string;
}

interface ExistingWorkflow {
  id: string;
  slug: string;
  title: string;
  description: string;
  input_prompt: string;
  trigger: string;
  process: string;
  action: string;
  tool_names: string[];
}

interface ToolsByType {
  trigger: Tool[];
  process: Tool[];
  action: Tool[];
}

const extractJsonFromText = (text: string): string => {
  try {
    console.log('Raw AI response:', text);

    const preprocessText = (str: string): string => {
      return str
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/```json\s*|\s*```/g, '')
        .trim();
    };

    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const jsonStr = preprocessText(codeBlockMatch[1]);
      console.log('Extracted JSON from code block:', jsonStr);
      JSON.parse(jsonStr);
      return jsonStr;
    }

    const singleTickMatch = text.match(/`([\s\S]*?)`/);
    if (singleTickMatch) {
      const jsonStr = preprocessText(singleTickMatch[1]);
      console.log('Extracted JSON from single ticks:', jsonStr);
      JSON.parse(jsonStr);
      return jsonStr;
    }

    let depth = 0;
    let start = -1;
    let end = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      const char = text[i];

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    if (start !== -1 && end !== -1) {
      const jsonStr = preprocessText(text.substring(start, end));
      console.log('Extracted JSON from balanced braces:', jsonStr);
      JSON.parse(jsonStr);
      return jsonStr;
    }

    const processedText = preprocessText(text);
    if (processedText.startsWith('{') && processedText.endsWith('}')) {
      console.log('Processing entire text as JSON:', processedText);
      JSON.parse(processedText);
      return processedText;
    }

    throw new Error('No valid JSON object found in text');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to extract JSON from text. Error:', error.message);
      console.error('Original text:', text);
      throw new Error(`Invalid JSON structure in response: ${error.message}`);
    }
    throw error;
  }
};

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const [inputPrompt, setInputPrompt] = useState('');
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isCreatingJson, setIsCreatingJson] = useState(false);
  const [validationPromptId, setValidationPromptId] = useState<string | null>(null);
  const [jsonCreationPromptId, setJsonCreationPromptId] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolsByType>({
    trigger: [],
    process: [],
    action: [],
  });
  const [existingWorkflows, setExistingWorkflows] = useState<ExistingWorkflow[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

  useEffect(() => {
    loadTools();
    loadExistingWorkflows();
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const { data: jsonCreationPrompt, error: jsonError } = await supabase
        .from('system_prompts')
        .select('id, prompt, ai_model_id, ai_models(model_id)')
        .eq('step', 'json_creation')
        .single();

      if (jsonError) throw jsonError;
      if (jsonCreationPrompt?.id) {
        setJsonCreationPromptId(jsonCreationPrompt.id);
      }

      const { data: validationPrompt, error: validationError } = await supabase
        .from('system_prompts')
        .select('id')
        .eq('step', 'validation')
        .single();

      if (validationError) throw validationError;
      if (validationPrompt?.id) {
        setValidationPromptId(validationPrompt.id);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
      toast.error('Failed to load system prompts');
    }
  };

  const loadTools = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('name');

      if (error) throw error;

      const toolsByType = data.reduce(
        (acc: ToolsByType, tool: Tool) => {
          acc[tool.type].push(tool);
          return acc;
        },
        { trigger: [], process: [], action: [] }
      );

      setTools(toolsByType);
    } catch (error) {
      console.error('Failed to load tools:', error);
      toast.error('Failed to load tools');
    }
  };

  const loadExistingWorkflows = async () => {
    try {
      setIsLoadingWorkflows(true);
      const { data, error } = await supabase
        .from('workflows')
        .select('id, slug, title, description, input_prompt, trigger, process, action, tool_names')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setExistingWorkflows(data || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      toast.error('Failed to load example workflows');
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  const validateWorkflow = async () => {
    if (!inputPrompt.trim()) {
      toast.error('Please enter a workflow description');
      return;
    }

    try {
      setIsValidating(true);
      setIsValidated(false);
      
      const { data: validationPrompt } = await supabase
        .from('system_prompts')
        .select('id, prompt, ai_model_id, ai_models(model_id)')
        .eq('step', 'validation')
        .single();

      if (!validationPrompt?.prompt || !validationPrompt.ai_models?.model_id) {
        throw new Error('Validation prompt not found');
      }

      const result = await callOpenRouter(
        validationPrompt.ai_models.model_id,
        validationPrompt.prompt,
        inputPrompt
      );

      const jsonString = extractJsonFromText(result);
      const parsedResult = JSON.parse(jsonString);

      if (parsedResult.isValid) {
        setWorkflowData({
          ...parsedResult.components,
          trigger_tool_id: tools.trigger[0]?.id,
          process_tool_id: tools.process[0]?.id,
          action_tool_id: tools.action[0]?.id,
        });
        setValidationPromptId(validationPrompt.id);
        setIsValidated(true);
        toast.success('Workflow validated successfully!');
      } else {
        toast.error(parsedResult.feedback || 'Invalid workflow format');
        setIsValidated(false);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate workflow');
      setIsValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  const createJson = async () => {
    if (!workflowData || !validationPromptId || !jsonCreationPromptId) {
      toast.error('Missing required data for workflow creation');
      return;
    }

    try {
      setIsCreatingJson(true);

      const { data: jsonPrompt } = await supabase
        .from('system_prompts')
        .select('prompt, ai_models(model_id)')
        .eq('id', jsonCreationPromptId)
        .single();

      if (!jsonPrompt?.prompt || !jsonPrompt.ai_models?.model_id) {
        throw new Error('JSON creation prompt not found');
      }

      const result = await callOpenRouter(
        jsonPrompt.ai_models.model_id,
        jsonPrompt.prompt,
        JSON.stringify(workflowData)
      );

      const jsonString = extractJsonFromText(result);
      const parsedJson = JSON.parse(jsonString);

      const { data: savedWorkflow, error: saveError } = await supabase
        .from('workflows')
        .insert({
          input_prompt: inputPrompt,
          trigger: workflowData.trigger,
          process: workflowData.process,
          action: workflowData.action,
          trigger_tool_id: workflowData.trigger_tool_id,
          process_tool_id: workflowData.process_tool_id,
          action_tool_id: workflowData.action_tool_id,
          json_output: parsedJson,
          validation_prompt_id: validationPromptId,
          json_creation_prompt_id: jsonCreationPromptId,
          title: `Workflow ${new Date().toISOString()}`,
          description: inputPrompt
        })
        .select()
        .single();

      if (saveError) throw saveError;

      navigate(`/workflow/${savedWorkflow.id}`);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      toast.error('Failed to create workflow');
    } finally {
      setIsCreatingJson(false);
    }
  };

  const useExistingWorkflow = (workflow: ExistingWorkflow) => {
    navigate(`/workflow/${workflow.slug}`);
  };

  const ToolSelector = ({
    type,
    value,
    onChange,
  }: {
    type: 'trigger' | 'process' | 'action';
    value?: string;
    onChange: (id: string) => void;
  }) => (
    <div className="flex gap-4 overflow-x-auto py-4 px-2 -mx-2">
      {tools[type].map((tool) => (
        <button
          key={tool.id}
          className={`tool-button ${value === tool.id ? 'selected' : ''}`}
          onClick={() => onChange(tool.id)}
          title={tool.description}
        >
          <img src={tool.icon} alt={tool.name} className="tool-icon" />
          <span className="text-sm font-medium">{tool.name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="section">
      <h1>Workflow Builder</h1>
      
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6">Create Your Workflow</h2>
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">
            Describe your workflow automation:
          </label>
          <textarea
            className="input h-32"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Example: When a new user signs up, send them a welcome email and add them to our newsletter list"
          />
        </div>
        <button
          className={`btn w-full sm:w-auto ${
            isValidated 
              ? 'bg-white text-[--brand-green] border border-[--brand-green] flex items-center justify-center gap-2' 
              : 'btn-primary'
          }`}
          onClick={validateWorkflow}
          disabled={!inputPrompt || isValidating}
        >
          {isValidating ? (
            'Validating...'
          ) : isValidated ? (
            <>
              Validated
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </>
          ) : (
            'Validate Workflow'
          )}
        </button>
      </div>

      {!workflowData && !isValidating && !isLoadingWorkflows && existingWorkflows.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">Example Workflows</h2>
          <div className="grid gap-6">
            {existingWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="border border-[--border-color] rounded-lg p-6 hover:border-[--brand-green] transition-all duration-200 cursor-pointer"
                onClick={() => useExistingWorkflow(workflow)}
              >
                <h3 className="text-xl font-semibold mb-2">{workflow.title}</h3>
                <p className="text-[--text-secondary] mb-4">{workflow.description}</p>
                <div className="flex flex-wrap gap-2">
                  {workflow.tool_names?.map((tool) => (
                    <span
                      key={tool}
                      className="px-3 py-1 bg-[--bg-secondary] rounded-full text-sm"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {workflowData && (
        <div className="card mb-8 animate-slide-up">
          <h2>Workflow Components</h2>
          <div className="space-y-8">
            <div>
              <h3>Trigger</h3>
              <input
                type="text"
                className="input mb-4"
                value={workflowData.trigger}
                onChange={(e) =>
                  setWorkflowData({ ...workflowData, trigger: e.target.value })
                }
              />
              <ToolSelector
                type="trigger"
                value={workflowData.trigger_tool_id}
                onChange={(id) =>
                  setWorkflowData({ ...workflowData, trigger_tool_id: id })
                }
              />
            </div>
            <div>
              <h3>Process</h3>
              <input
                type="text"
                className="input mb-4"
                value={workflowData.process}
                onChange={(e) =>
                  setWorkflowData({ ...workflowData, process: e.target.value })
                }
              />
              <ToolSelector
                type="process"
                value={workflowData.process_tool_id}
                onChange={(id) =>
                  setWorkflowData({ ...workflowData, process_tool_id: id })
                }
              />
            </div>
            <div>
              <h3>Action</h3>
              <input
                type="text"
                className="input mb-4"
                value={workflowData.action}
                onChange={(e) =>
                  setWorkflowData({ ...workflowData, action: e.target.value })
                }
              />
              <ToolSelector
                type="action"
                value={workflowData.action_tool_id}
                onChange={(id) =>
                  setWorkflowData({ ...workflowData, action_tool_id: id })
                }
              />
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button
              className="btn btn-primary"
              onClick={createJson}
              disabled={isCreatingJson || !validationPromptId}
            >
              {isCreatingJson
                ? 'Creating JSON...'
                : 'Create JSON'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}