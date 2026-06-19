import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartCount } from '../features/cart/cartSlice';
import { selectCurrentUser, selectIsAuthenticated, logout } from '../features/auth/authSlice';
import AuthModal from '../features/auth/AuthModal';
import VerifyEmailPromptModal from '../features/auth/VerifyEmailPromptModal';

import { useGetMeQuery } from '../features/auth/authApiSlice';
import { catalogApiSlice, useSearchSuggestionsQuery } from '../features/catalog/catalogApiSlice';
import type { SearchSuggestion } from '../features/catalog/catalogApiSlice';
import { useDebounce } from '../hooks/useDebounce';

const navItems = [
  { label: 'New Arrivals', href: '/catalog?newArrivals=true' },
  { label: 'Formals', href: '/catalog?categorySlug=formals' },
  { label: 'Occasionwear', href: '/catalog?categorySlug=occasionwear' },
  { label: 'Sale', href: '/catalog?isSale=true' },
];

const MIN_SEARCH_QUERY_LENGTH = 2;

const buildCloudinarySuggestionImage = (imageUrl: string) => {
  if (!imageUrl.includes('/image/upload/')) {
    return imageUrl;
  }

  return imageUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto:eco,c_fill,g_auto,w_96,h_120/');
};

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
  const dispatch = useDispatch();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSuggestions, setLastSuggestions] = useState<SearchSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const prefetchProduct = catalogApiSlice.usePrefetch('getProductBySlug');

  // Fast debounce with a minimum query length keeps search responsive without firing on every key.
  const trimmedSearchQuery = searchQuery.trim();
  const debouncedQuery = useDebounce(trimmedSearchQuery, 180);
  const canSearch = debouncedQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  const { data: suggestions, isFetching, isError } = useSearchSuggestionsQuery(
    { query: debouncedQuery, limit: 6 },
    {
      skip: !canSearch,
      // Cached suggestions stay reusable while the next query is fetched.
      refetchOnMountOrArgChange: false,
    }
  );

  // Keep previous results visible while the next query is in flight to avoid a loading flash.
  useEffect(() => {
    if (suggestions) {
      setLastSuggestions(suggestions);
    }
  }, [suggestions]);

  const displayResults: SearchSuggestion[] = suggestions ?? (canSearch ? lastSuggestions : []);
  const hasQuery = trimmedSearchQuery.length > 0;
  const showDropdown = isSearchOpen && hasQuery;
  const shouldShowNoResults = canSearch && !isFetching && displayResults.length === 0;

  const prefetchProductDetail = useCallback((slug: string) => {
    prefetchProduct(slug, { ifOlderThan: 60 });
  }, [prefetchProduct]);

  // Navigate to a selected product suggestion and close the dropdown
  const handleSelectSuggestion = useCallback((slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setActiveIndex(-1);
    navigate(`/product/${slug}`);
  }, [navigate]);

  // Keyboard navigation: arrow keys to move, Enter to select, Escape to close
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || displayResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < displayResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : displayResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < displayResults.length) {
          handleSelectSuggestion(displayResults[activeIndex].slug);
        }
        break;
      case 'Escape':
        setIsSearchOpen(false);
        setActiveIndex(-1);
        break;
    }
  }, [showDropdown, displayResults, activeIndex, handleSelectSuggestion]);

  // Reset search state on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    setActiveIndex(-1);
  }, [location.pathname, location.search]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    dispatch(logout());
  };

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
        <div className="container mx-auto flex h-20 lg:h-32 items-center justify-between gap-4 px-4 lg:gap-5 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="grid h-10 w-10 place-items-center border border-[#d8cdbb] bg-white text-[#111827] transition-colors hover:border-[#9d731e]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <Link to="/" className="shrink-0 leading-none">
            <img src="/logo.jpeg" alt="Urbaniq" className="h-[70px] lg:h-[120px] w-auto object-contain mix-blend-multiply" />
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

          {/* Desktop Search */}
          <div className="hidden flex-1 max-w-sm px-6 lg:block relative z-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a39f97]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                placeholder="Search products..."
                className="w-full bg-[#fbfaf7] border border-[#d8cdbb] h-10 pl-10 pr-4 text-[11px] font-black uppercase tracking-[0.1em] text-[#111827] placeholder:text-[#a39f97] focus:outline-none focus:border-[#9d731e] transition-colors"
                role="combobox"
                aria-expanded={showDropdown}
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
              />
            </div>
            
            {/* Desktop Search Dropdown */}
            {showDropdown && (
              <div 
                className="absolute top-full left-6 right-6 mt-1 bg-white border border-[#e8e0d0] shadow-xl rounded-sm overflow-hidden z-50"
                onMouseDown={(e) => e.preventDefault()}
                role="listbox"
              >
                {isError ? (
                  <div className="p-4 text-center text-xs font-bold text-[#111827] uppercase tracking-widest">
                    Error loading results
                  </div>
                ) : shouldShowNoResults ? (
                  <div className="p-4 text-center text-xs font-bold text-[#111827] uppercase tracking-widest">
                    No results for "{searchQuery}"
                  </div>
                ) : displayResults.length > 0 ? (
                  <div className="max-h-[60vh] overflow-y-auto">
                    {displayResults.map((product, index) => (
                      <button
                        key={product.id}
                        id={`suggestion-${index}`}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseDown={() => handleSelectSuggestion(product.slug)}
                        onMouseEnter={() => setActiveIndex(index)}
                        onPointerEnter={() => prefetchProductDetail(product.slug)}
                        onFocus={() => prefetchProductDetail(product.slug)}
                        className={`flex w-full items-center gap-4 p-3 text-left transition-colors border-b border-[#e8e0d0] last:border-0 ${
                          index === activeIndex ? 'bg-[#f5f0e8]' : 'hover:bg-[#fbfaf7]'
                        }`}
                      >
                        <div className="h-12 w-10 shrink-0 bg-[#efe7da] overflow-hidden">
                           <img src={buildCloudinarySuggestionImage(product.image)} loading="lazy" decoding="async" className="h-full w-full object-cover" alt="" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <p className="text-xs font-bold text-[#111827] line-clamp-1">{product.productName}</p>
                           <div className="mt-1 flex items-center gap-2">
                             {product.discount > 0 ? (
                               <>
                                 <span className="text-[10px] font-bold text-[#9d731e]">Rs. {product.price - product.discount}</span>
                                 <span className="text-[9px] font-medium text-[#a39f97] line-through">Rs. {product.price}</span>
                               </>
                             ) : (
                               <span className="text-[10px] font-bold text-[#6f6659]">Rs. {product.price}</span>
                             )}
                           </div>
                        </div>
                        <span className="ml-auto text-[9px] font-semibold text-[#a39f97] uppercase tracking-wider shrink-0">{product.categoryName}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="grid lg:hidden h-10 w-10 place-items-center border border-[#d8cdbb] bg-white text-[#111827] transition-colors hover:border-[#9d731e]"
              aria-label="Search catalog"
            >
              {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
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

      {/* Mobile Search Dropdown */}
      {isSearchOpen && (
        <div className="absolute top-[80px] left-0 right-0 z-40 bg-[#fbfaf7] border-b border-[#e8e0d0] p-4 shadow-md lg:hidden">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a39f97]" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search products..."
                className="w-full bg-white border border-[#d8cdbb] h-10 pl-10 pr-4 text-[11px] font-black uppercase tracking-[0.1em] text-[#111827] placeholder:text-[#a39f97] focus:outline-none focus:border-[#9d731e]"
                role="combobox"
                aria-expanded={hasQuery}
                aria-autocomplete="list"
              />
           </div>
           {hasQuery && (
              <div 
                className="mt-2 bg-white border border-[#e8e0d0] shadow-sm max-h-[60vh] overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
                role="listbox"
              >
                {isError ? (
                  <div className="p-4 text-center text-xs font-bold text-[#111827] uppercase tracking-widest">Error</div>
                ) : shouldShowNoResults ? (
                  <div className="p-4 text-center text-xs font-bold text-[#111827] uppercase tracking-widest">
                    No results for "{searchQuery}"
                  </div>
                ) : displayResults.length > 0 ? (
                  displayResults.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseDown={() => handleSelectSuggestion(product.slug)}
                        onPointerEnter={() => prefetchProductDetail(product.slug)}
                        onFocus={() => prefetchProductDetail(product.slug)}
                        className={`flex w-full items-center gap-4 p-3 text-left transition-colors border-b border-[#e8e0d0] last:border-0 ${
                          index === activeIndex ? 'bg-[#f5f0e8]' : 'hover:bg-[#fbfaf7]'
                        }`}
                      >
                        <div className="h-12 w-10 shrink-0 bg-[#efe7da] overflow-hidden">
                           <img src={buildCloudinarySuggestionImage(product.image)} loading="lazy" decoding="async" className="h-full w-full object-cover" alt="" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <p className="text-xs font-bold text-[#111827] line-clamp-1">{product.productName}</p>
                           <div className="mt-1 flex items-center gap-2">
                             {product.discount > 0 ? (
                               <>
                                 <span className="text-[10px] font-bold text-[#9d731e]">Rs. {product.price - product.discount}</span>
                                 <span className="text-[9px] font-medium text-[#a39f97] line-through">Rs. {product.price}</span>
                               </>
                             ) : (
                               <span className="text-[10px] font-bold text-[#6f6659]">Rs. {product.price}</span>
                             )}
                           </div>
                        </div>
                        <span className="ml-auto text-[9px] font-semibold text-[#a39f97] uppercase tracking-wider shrink-0">{product.categoryName}</span>
                      </button>
                  ))
                ) : null}
              </div>
           )}
        </div>
      )}

      <main>
        <Outlet />
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-[#111827]/60 backdrop-blur-md transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true" 
          />
          <div className="relative flex w-[200px] flex-col overflow-y-auto bg-[#111827] shadow-2xl transition-transform [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Header with Logo and Close */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                <img src="/logo.jpeg" alt="Urbaniq" className="h-8 w-auto object-contain invert opacity-90" />
              </Link>
              <button
                type="button"
                className="relative -mr-2 inline-flex items-center justify-center rounded-full p-2 text-[#a39f97] transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Main Navigation Links */}
            <div className="mt-6 flex flex-col space-y-1 px-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center overflow-hidden rounded-sm px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#d7b46a]/10 text-[#d7b46a]' 
                        : 'text-[#a39f97] hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <span className="relative z-10">{item.label}</span>
                  {/* Subtle hover effect bar */}
                  <span className="absolute left-0 top-0 h-full w-1 origin-left scale-y-0 bg-[#d7b46a] transition-transform duration-300 group-hover:scale-y-100" />
                </NavLink>
              ))}
            </div>

            {/* Bottom Auxiliary Links */}
            <div className="mt-auto px-8 pb-10 pt-10">
              <div className="mb-6 h-px w-8 bg-white/20" />
              <div className="flex flex-col gap-5 text-[10px] font-bold uppercase tracking-widest text-[#6f6b61]">
                {isAuthenticated ? (
                  <Link 
                    to={user?.role === 'Admin' ? '/admin' : '/account'} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="transition-colors hover:text-[#d7b46a]"
                  >
                    My Account
                  </Link>
                ) : (
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal();
                    }} 
                    className="text-left transition-colors hover:text-[#d7b46a]"
                  >
                    Sign In / Register
                  </button>
                )}
                <Link 
                  to="/cart" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="transition-colors hover:text-[#d7b46a]"
                >
                  Bag {cartCount > 0 && `(${cartCount})`}
                </Link>
                <Link 
                  to="/wishlist" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="transition-colors hover:text-[#d7b46a]"
                >
                  Wishlist
                </Link>
                {isAuthenticated && (
                  <button 
                    onClick={handleLogout}
                    className="text-left transition-colors hover:text-[#d7b46a]"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} redirectTo={redirectTo} />
      <VerifyEmailPromptModal />
    </div>
  );
}
