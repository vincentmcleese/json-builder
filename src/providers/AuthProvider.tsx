import { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuthState } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const { user, signOut: authSignOut } = useAuthState();

  const handleSignOut = async () => {
    await authSignOut();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}