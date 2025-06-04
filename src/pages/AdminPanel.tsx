import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import OpenRouterCredits from '@/components/OpenRouterCredits';

interface AIModel {
  id: string;
  name: string;
  model_id: string;
}

interface SystemPrompt {
  id: string;
  step: string;
  prompt: string;
  ai_model_id: string;
}

interface TrainingData {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export default function AdminPanel() {
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTrainingData, setNewTrainingData] = useState({ name: '', content: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [modelsResponse, promptsResponse, trainingResponse] = await Promise.all([
        supabase.from('ai_models').select('*').order('name'),
        supabase.from('system_prompts').select('*'),
        supabase.from('training_data').select('*').order('created_at', { ascending: false }),
      ]);

      if (modelsResponse.error) throw modelsResponse.error;
      if (promptsResponse.error) throw promptsResponse.error;
      if (trainingResponse.error) throw trainingResponse.error;

      setAiModels(modelsResponse.data);
      setSystemPrompts(promptsResponse.data);
      setTrainingData(trainingResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrompt = async (promptId: string, updates: Partial<SystemPrompt>) => {
    try {
      const { error } = await supabase
        .from('system_prompts')
        .update(updates)
        .eq('id', promptId);

      if (error) throw error;

      setSystemPrompts((prompts) =>
        prompts.map((p) => (p.id === promptId ? { ...p, ...updates } : p))
      );
      toast.success('Prompt updated successfully');
    } catch (error) {
      console.error('Failed to update prompt:', error);
      toast.error('Failed to update prompt');
    }
  };

  const addTrainingData = async () => {
    if (!newTrainingData.name.trim() || !newTrainingData.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.from('training_data').insert({
        name: newTrainingData.name.trim(),
        content: newTrainingData.content.trim()
      });

      if (error) throw error;

      loadData();
      setNewTrainingData({ name: '', content: '' });
      setShowAddForm(false);
      toast.success('Training data added successfully');
    } catch (error) {
      console.error('Failed to add training data:', error);
      toast.error('Failed to add training data');
    }
  };

  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filePromises = Array.from(files).map(async (file) => {
      try {
        const content = await file.text();
        const jsonContent = JSON.parse(content); // Validate JSON
        
        return {
          name: file.name.replace(/\.json$/, ''),
          content: content
        };
      } catch (error) {
        toast.error(`Failed to parse ${file.name}: Invalid JSON`);
        return null;
      }
    });

    const results = await Promise.all(filePromises);
    const validData = results.filter((result): result is { name: string; content: string } => result !== null);

    if (validData.length === 0) return;

    try {
      const { error } = await supabase
        .from('training_data')
        .insert(validData);

      if (error) throw error;

      loadData();
      toast.success(`Successfully added ${validData.length} training examples`);
      
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      console.error('Failed to add JSON training data:', error);
      toast.error('Failed to add JSON training data');
    }
  };

  const updateTrainingData = async (id: string, content: string) => {
    try {
      const { error } = await supabase
        .from('training_data')
        .update({ content })
        .eq('id', id);

      if (error) throw error;

      setTrainingData((data) =>
        data.map((d) => (d.id === id ? { ...d, content } : d))
      );
      setEditingId(null);
      toast.success('Training data updated');
    } catch (error) {
      console.error('Failed to update training data:', error);
      toast.error('Failed to update training data');
    }
  };

  const deleteTrainingData = async (id: string) => {
    try {
      const { error } = await supabase
        .from('training_data')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTrainingData((data) => data.filter((d) => d.id !== id));
      toast.success('Training data deleted');
    } catch (error) {
      console.error('Failed to delete training data:', error);
      toast.error('Failed to delete training data');
    }
  };

  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  const getFullPrompt = (basePrompt: string): string => {
    let fullPrompt = basePrompt + '\n\n# Training Examples\n\n';
    trainingData.forEach(data => {
      fullPrompt += `## ${data.name}\n\n${data.content}\n\n`;
    });
    return fullPrompt;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--brand-green]"></div>
      </div>
    );
  }

  const jsonCreationPrompt = systemPrompts.find((p) => p.step === 'json_creation');
  const basePromptTokens = jsonCreationPrompt
    ? estimateTokens(jsonCreationPrompt.prompt)
    : 0;
  const trainingDataTokens = trainingData.reduce((acc, data) => {
    return acc + estimateTokens(data.content);
  }, 0);
  const totalTokens = basePromptTokens + trainingDataTokens;

  return (
    <div className="section">
      <h1>Admin Panel</h1>

      <OpenRouterCredits />

      <div className="space-y-8">
        {/* System Prompts */}
        {systemPrompts.map((prompt) => (
          <div key={prompt.id} className="card">
            <div className="flex justify-between items-start mb-6">
              <h2 className="mb-0 capitalize">{prompt.step} Prompt</h2>
              <select
                className="input max-w-xs"
                value={prompt.ai_model_id}
                onChange={(e) =>
                  updatePrompt(prompt.id, { ai_model_id: e.target.value })
                }
              >
                {aiModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              className="input h-48 font-mono text-sm mb-4"
              value={prompt.prompt}
              onChange={(e) => updatePrompt(prompt.id, { prompt: e.target.value })}
            />

            {prompt.step === 'json_creation' && (
              <div className="space-y-4">
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => setShowFullPrompt(!showFullPrompt)}
                >
                  {showFullPrompt ? 'Hide' : 'View'} full prompt including training data
                </button>

                {showFullPrompt && (
                  <div className="bg-[--bg-secondary] p-6 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                      {getFullPrompt(prompt.prompt)}
                    </pre>
                  </div>
                )}

                <div className="bg-[--bg-secondary] p-6 rounded-lg text-sm">
                  <h3 className="font-semibold mb-2">Token Estimation</h3>
                  <ul className="space-y-2">
                    <li>Base prompt: ~{basePromptTokens} tokens</li>
                    <li>Training data: ~{trainingDataTokens} tokens</li>
                    <li className="font-bold">Total: ~{totalTokens} tokens</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Training Data */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="mb-0">Training Data ({trainingData.length} entries)</h2>
            <div className="flex gap-4">
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                Add Training Data
              </button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  multiple
                  onChange={handleJsonUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="btn btn-secondary">
                  Add Examples (JSON)
                </button>
              </div>
            </div>
          </div>

          {showAddForm && (
            <div className="mb-6 p-6 border border-[--border-color] rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Add New Training Data</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    className="input"
                    value={newTrainingData.name}
                    onChange={(e) => setNewTrainingData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a descriptive name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    className="input h-32"
                    value={newTrainingData.content}
                    onChange={(e) => setNewTrainingData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Add training data content..."
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    className="btn btn-primary"
                    onClick={addTrainingData}
                  >
                    Save Training Data
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTrainingData({ name: '', content: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {trainingData.map((data) => (
              <div
                key={data.id}
                className="border border-[--border-color] rounded-lg p-6 hover:border-[--brand-green] transition-colors duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{data.name}</h3>
                    <span className="text-sm text-[--text-secondary]">
                      {new Date(data.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      className="text-[--brand-green] hover:text-[--brand-green-dark] font-medium transition-colors duration-200"
                      onClick={() => setEditingId(data.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                      onClick={() => deleteTrainingData(data.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === data.id ? (
                  <div>
                    <textarea
                      className="input h-32 mb-4 font-mono text-sm"
                      value={data.content}
                      onChange={(e) =>
                        setTrainingData((prev) =>
                          prev.map((d) =>
                            d.id === data.id
                              ? { ...d, content: e.target.value }
                              : d
                          )
                        )
                      }
                    />
                    <div className="flex gap-4">
                      <button
                        className="btn btn-primary"
                        onClick={() => updateTrainingData(data.id, data.content)}
                      >
                        Save Changes
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[--text-secondary]">
                    ~{estimateTokens(data.content)} tokens
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}