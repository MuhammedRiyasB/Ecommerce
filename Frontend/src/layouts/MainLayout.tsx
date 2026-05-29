import { Link, NavLink, Outlet } from 'react-router-dom';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCartCount } from '../features/cart/cartSlice';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSlice';

const navItems = [
  { label: 'New Arrivals', href: '/catalog' },
  { label: 'Formals', href: '/catalog' },
  { label: 'Occasionwear', href: '/catalog' },
  { label: 'Sale', href: '/catalog' },
];

export default function MainLayout() {
  const cartCount = useSelector(selectCartCount);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const accountHref = isAuthenticated ? (user?.role === 'Admin' ? '/admin' : '/account') : '/login';

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#111827]">
      <header className="sticky top-0 z-30 border-b border-[#e8e0d0] bg-[#fbfaf7]/95 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between gap-5">
          <Link to="/" className="shrink-0 leading-none">
            <span className="block text-[10px] font-black uppercase tracking-[0.45em] text-[#9d731e]">Urbaniq</span>
            <span className="mt-1 block text-2xl font-black uppercase tracking-[0.14em] text-[#111827]">Atelier</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                className={({ isActive }) =>
                  `text-[11px] font-black uppercase tracking-[0.22em] transition-colors ${
                    isActive ? 'text-[#9d731e]' : 'text-[#514b43] hover:text-[#9d731e]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/catalog"
              className="grid h-10 w-10 place-items-center border border-[#d8cdbb] bg-white text-[#111827] transition-colors hover:border-[#9d731e]"
              aria-label="Search catalog"
            >
              <Search className="h-4 w-4" />
            </Link>
            <Link
              to="/wishlist"
              className="hidden h-10 w-10 place-items-center border border-[#d8cdbb] bg-white text-[#111827] transition-colors hover:border-[#9d731e] sm:grid"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4" />
            </Link>
            <Link
              to={accountHref}
              className="grid h-10 w-10 place-items-center border border-[#d8cdbb] bg-white text-[#111827] transition-colors hover:border-[#9d731e]"
              aria-label={isAuthenticated ? 'Account' : 'Sign in'}
            >
              <User className="h-4 w-4" />
            </Link>
            <Link
              to="/cart"
              className="relative grid h-10 w-10 place-items-center border border-[#d8cdbb] bg-[#111827] text-white transition-colors hover:border-[#9d731e]"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#d7b46a] px-1 text-[10px] font-black text-[#111827]">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
