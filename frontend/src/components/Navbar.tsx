import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex items-center gap-6 shadow">
      <Link to="/" className="text-lg font-bold tracking-tight">
        Kredi Yonetimi
      </Link>
      <Link to="/" className="text-sm opacity-80 hover:opacity-100">Musteriler</Link>
    </nav>
  );
}
