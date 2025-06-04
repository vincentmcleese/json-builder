import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Workflow {
  id: string;
  slug: string;
  title: string;
  description: string;
  input_prompt: string;
  trigger: string;
  process: string;
  action: string;
  json_output: Record<string, any>;
  tool_names: string[];
}

export default function WorkflowPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJsonExpanded, setIsJsonExpanded] = useState(false);
  const [guideEmail, setGuideEmail] = useState('');
  const [isSendingGuide, setIsSendingGuide] = useState(false);

  useEffect(() => {
    loadWorkflow();
  }, [slug]);

  const loadWorkflow = async () => {
    if (!slug) {
      toast.error('No workflow identifier provided');
      navigate('/');
      return;
    }

    try {
      setIsLoading(true);
      
      let { data } = await supabase
        .from('workflows')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
        const { data: idData } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', slug)
          .maybeSingle();

        data = idData;
      }

      if (!data) {
        toast.error('Workflow not found');
        navigate('/');
        return;
      }

      if (data.slug && slug !== data.slug) {
        navigate(`/workflow/${data.slug}`, { replace: true });
        return;
      }

      setWorkflow(data);
    } catch (error) {
      console.error('Failed to load workflow:', error);
      toast.error('Failed to load workflow');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const sendGuide = async () => {
    if (!guideEmail) {
      toast.error('Please enter your email');
      return;
    }

    try {
      setIsSendingGuide(true);
      // TODO: Implement guide sending functionality
      toast.success('Guide has been sent to your email!');
      setGuideEmail('');
    } catch (error) {
      console.error('Failed to send guide:', error);
      toast.error('Failed to send guide');
    } finally {
      setIsSendingGuide(false);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(workflow?.json_output, null, 2));
    toast.success('JSON copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--brand-green]"></div>
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  const jsonString = JSON.stringify(workflow.json_output, null, 2);

  return (
    <div className="section">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{workflow.title}</h1>
        <p className="text-lg text-[--text-secondary]">{workflow.description}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-8">
        <div className="card">
          <h2>Workflow Components</h2>
          <div className="space-y-6">
            <div>
              <h3>Trigger</h3>
              <p className="text-[--text-secondary]">{workflow.trigger}</p>
            </div>
            <div>
              <h3>Process</h3>
              <p className="text-[--text-secondary]">{workflow.process}</p>
            </div>
            <div>
              <h3>Action</h3>
              <p className="text-[--text-secondary]">{workflow.action}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Tools Used</h2>
          <div className="flex flex-wrap gap-3">
            {workflow.tool_names?.map((tool) => (
              <span
                key={tool}
                className="px-4 py-2 bg-[--bg-secondary] rounded-full text-sm"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="mb-0">Generated JSON</h2>
          <button className="btn btn-secondary" onClick={copyJson}>
            Copy JSON
          </button>
        </div>
        
        <div className="bg-[--bg-secondary] rounded-lg overflow-hidden">
          <pre 
            className="p-6 font-mono text-sm overflow-x-auto"
            style={{ maxHeight: isJsonExpanded ? 'none' : '200px' }}
          >
            {jsonString}
          </pre>
          {jsonString.split('\n').length > 10 && (
            <button
              className="w-full py-2 text-sm text-[--text-secondary] hover:text-[--text-primary] transition-colors duration-200 border-t border-[--border-color]"
              onClick={() => setIsJsonExpanded(!isJsonExpanded)}
            >
              {isJsonExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        <div className="mt-8 p-6 bg-[--bg-secondary] rounded-lg">
          <h3 className="text-xl font-semibold mb-4">
            Get the setup guide for {workflow.title}
          </h3>
          <div className="flex gap-4">
            <input
              type="email"
              className="input flex-1"
              placeholder="Enter your email"
              value={guideEmail}
              onChange={(e) => setGuideEmail(e.target.value)}
            />
            <button
              className="btn btn-primary whitespace-nowrap"
              onClick={sendGuide}
              disabled={isSendingGuide}
            >
              {isSendingGuide ? 'Sending...' : 'Email the guide'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}