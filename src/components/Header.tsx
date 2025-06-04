import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white border-b border-[--border-color]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold text-[--text-primary] m-0">
              Ghostteam JSON builder for N8N
            </h1>
          </Link>
        </div>
      </div>
    </header>
  );
}