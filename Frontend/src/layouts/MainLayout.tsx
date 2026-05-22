import { Outlet, Link } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Urbaniq
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
