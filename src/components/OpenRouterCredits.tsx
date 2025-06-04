import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CreditsResponse {
  credits: number;
  credits_used: number;
}

interface OpenRouterAPIResponse {
  data: {
    total_credits: number;
    total_usage: number;
  };
}

export default function OpenRouterCredits() {
  const [credits, setCredits] = useState<CreditsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = (await response.json()) as OpenRouterAPIResponse;
      
      // Validate the response data matches our expected interface
      if (data.data && typeof data.data.total_credits === 'number' && typeof data.data.total_usage === 'number') {
        setCredits({
          credits: data.data.total_credits,
          credits_used: data.data.total_usage
        });
      } else {
        console.error('Invalid credits data format:', data);
        toast.error('Received invalid credits data format');
        setCredits(null);
      }
    } catch (error) {
      console.error('Failed to fetch OpenRouter credits:', error);
      toast.error('Failed to fetch credits information');
      setCredits(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[--brand-green]"></div>
      </div>
    );
  }

  if (!credits) {
    return (
      <div className="card mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold mb-0">OpenRouter Credits</h2>
          <button 
            onClick={fetchCredits}
            className="text-[--brand-green] hover:text-[--brand-green-dark] transition-colors"
          >
            Refresh
          </button>
        </div>
        <p className="mt-4 text-[--text-secondary]">Unable to load credits information</p>
      </div>
    );
  }

  return (
    <div className="card mb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-0">OpenRouter Credits</h2>
        <button 
          onClick={fetchCredits}
          className="text-[--brand-green] hover:text-[--brand-green-dark] transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[--text-secondary] mb-1">Available Credits</p>
          <p className="text-2xl font-semibold">{credits.credits.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[--text-secondary] mb-1">Credits Used</p>
          <p className="text-2xl font-semibold">{credits.credits_used.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}