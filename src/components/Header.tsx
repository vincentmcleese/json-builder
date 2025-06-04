import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function Header() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-[--border-color]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold text-[--text-primary] m-0">
              Ghostteam JSON builder for N8N
            </h1>
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[--brand-green] transition-colors duration-200 focus:outline-none"
              >
                <img
                  src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || '')}`}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-[--border-color]">
                  <div className="px-4 py-2 border-b border-[--border-color]">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-[--text-primary] hover:bg-[--bg-secondary] transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/authenticate" 
              className="btn btn-secondary"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}