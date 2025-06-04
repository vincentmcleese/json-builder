import { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuthState } from '@/hooks/useAuth';

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
  const { user, signOut } = useAuthState();

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}