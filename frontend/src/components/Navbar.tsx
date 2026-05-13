import { Link } from 'react-router-dom';

export default function Navbar() {

  return (
    <nav className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white px-6 py-0 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center group-hover:bg-white/25 transition-colors">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">Kredi Yönetimi</span>
        </Link>
      </div>
    </nav>
  );
}
