import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreatingWorkflow() {
  const navigate = useNavigate();
  const workflowData = JSON.parse(sessionStorage.getItem('pendingWorkflow') || '{}');

  useEffect(() => {
    if (!workflowData.id) {
      navigate('/');
      return;
    }

    const checkStatus = async () => {
      // In a real implementation, we would check the workflow status
      // For now, we'll just simulate a delay and redirect
      await new Promise(resolve => setTimeout(resolve, 2000));
      sessionStorage.removeItem('pendingWorkflow');
      navigate(`/workflow/${workflowData.id}`);
    };

    checkStatus();
  }, [navigate, workflowData.id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--brand-green] mb-8"></div>
      <h2 className="text-2xl font-semibold mb-4">Creating Your Workflow</h2>
      <p className="text-[--text-secondary]">Please wait while we generate your workflow...</p>
    </div>
  );
}