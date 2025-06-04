import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
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
          {user && (
            <button 
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}