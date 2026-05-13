import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex items-center gap-6 shadow">
      <Link to="/" className="text-lg font-bold tracking-tight">
        💳 Kredi Yönetimi
      </Link>
      <Link
        to="/"
        className={`text-sm ${pathname === '/' ? 'underline underline-offset-4' : 'opacity-80 hover:opacity-100'}`}
      >
        Müşteriler
      </Link>
    </nav>
  );
}
