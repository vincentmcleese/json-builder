import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '@/providers/AuthProvider';

interface AuthLog {
  timestamp: string;
  event: string;
  details?: string;
}

export default function AuthenticatePage() {
  const { user, signOut } = useAuth();
  const [logs, setLogs] = useState<AuthLog[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      addLog('Session check', session ? 'User is logged in' : 'No active session');
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      addLog('Auth state change', session ? 'User logged in' : 'User logged out');
    });

    return () => subscription.unsubscribe();
  }, []);

  const addLog = (event: string, details?: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      event,
      details
    }]);
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Error:', error);
        addLog('Login error', error instanceof Error ? error.message : 'Unknown error');
        toast.error('Failed to login with Google');
        return;
      }

      addLog('Google login initiated', data ? 'Redirect started' : 'No redirect');
    } catch (error) {
      console.error('Error:', error);
      addLog('Login error', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Failed to login with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      addLog('Logout', 'User logged out successfully');
    } catch (error) {
      console.error('Error:', error);
      addLog('Logout error', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="section">
      <h1>Authentication Test Page</h1>

      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6">Current Status</h2>
        {user ? (
          <div>
            <p className="mb-4">
              Logged in as: <span className="font-semibold">{user.email}</span>
            </p>
            <button
              onClick={handleSignOut}
              className="btn btn-primary"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Login with Google
          </button>
        )}
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Auth Logs</h2>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="text-sm text-gray-500">
                {new Date(log.timestamp).toLocaleString()}
              </div>
              <div className="font-semibold">{log.event}</div>
              {log.details && (
                <div className="text-sm text-gray-600">{log.details}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}