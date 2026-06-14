import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCartCount } from '../features/cart/cartSlice';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSlice';
import AuthModal from '../features/auth/AuthModal';
import VerifyEmailPromptModal from '../features/auth/VerifyEmailPromptModal';

import { useGetMeQuery } from '../features/auth/authApiSlice';

const navItems = [
  { label: 'New Arrivals', href: '/catalog?newArrivals=true' },
  { label: 'Formals', href: '/catalog?categorySlug=formals' },
  { label: 'Occasionwear', href: '/catalog?categorySlug=occasionwear' },
  { label: 'Sale', href: '/catalog?isSale=true' },
];

export default function MainLayout() {
  const cartCount = useSelector(selectCartCount);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  // Automatically track and update user profile on focus/reconnect
  useGetMeQuery(undefined, { skip: !isAuthenticated });

  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthModalOpen = searchParams.get('auth') === 'login' && !isAuthenticated;
  const redirectTo = searchParams.get('redirectTo') || location.pathname;

  const openAuthModal = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('auth', 'login');
    nextParams.set('redirectTo', location.pathname);
    navigate(`${location.pathname}?${nextParams.toString()}`, { replace: false });
  };

  const closeAuthModal = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('auth');
    nextParams.delete('redirectTo');
    const query = nextParams.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true });
  };

  return (
    <div className="min-h-dvh bg-[#fbfaf7] text-[#111827]">
      <header className="sticky top-0 z-30 border-b border-[#e8e0d0] bg-[#fbfaf7]/95 backdrop-blur-xl">
        <div className="container mx-auto flex h-32 items-center justify-between gap-5">
          <Link to="/" className="shrink-0 leading-none">
            <img src="/logo.jpeg" alt="Urbaniq" className="h-[120px] w-auto object-contain mix-blend-multiply" />
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
            {isAuthenticated ? (
              <Link
                to={user?.role === 'Admin' ? '/admin' : '/account'}
                className="grid h-10 w-10 place-items-center border border-[#d8cdbb] bg-white text-[#111827] transition-colors hover:border-[#9d731e]"
                aria-label="Account"
              >
                <User className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="grid h-10 w-10 place-items-center border border-[#d8cdbb] bg-white text-[#111827] transition-colors hover:border-[#9d731e]"
                aria-label="Sign in"
              >
                <User className="h-4 w-4" />
              </button>
            )}
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

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} redirectTo={redirectTo} />
      <VerifyEmailPromptModal />
    </div>
  );
}
