import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetProductsQuery, useGetCategoriesQuery, type Category } from './catalogApiSlice';
import ProductCard from './components/ProductCard';
import { ChevronDown, Filter, Grid3X3, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const flattenCategories = (categories: Category[] = []): Category[] =>
  categories.flatMap((category) => [category, ...flattenCategories(category.subCategories || [])]);

const priceRanges = [
  { label: 'Under ₹999', minPrice: undefined, maxPrice: 999 },
  { label: '₹1,000 - ₹2,499', minPrice: 1000, maxPrice: 2499 },
  { label: '₹2,500 - ₹4,999', minPrice: 2500, maxPrice: 4999 },
  { label: '₹5,000 and above', minPrice: 5000, maxPrice: undefined },
];

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageNumber, setPageNumber] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const search = searchParams.get('search') || undefined;
  const size = searchParams.get('size') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const categorySlug = searchParams.get('categorySlug') || undefined;
  const isSale = searchParams.get('isSale') === 'true' ? true : undefined;
  const newArrivals = searchParams.get('newArrivals') === 'true';

  const { data: categories } = useGetCategoriesQuery();
  const allCategories = useMemo(() => flattenCategories(categories || []), [categories]);
  const activeCategory = categorySlug
    ? allCategories.find((c) => c.slug?.toLowerCase() === categorySlug.toLowerCase())
    : allCategories.find((c) => c.categoryId === categoryId);

  // Compute dynamic page title based on navigation context
  const pageTitle = useMemo(() => {
    if (isSale) return 'Sale';
    if (newArrivals) return 'New Arrivals';
    if (activeCategory) return activeCategory.categoryName;
    if (categorySlug) return categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
    if (search) return 'Search Results';
    return 'All Products';
  }, [isSale, newArrivals, activeCategory, categorySlug, search]);

  // Compute page subtitle
  const pageSubtitle = useMemo(() => {
    if (isSale) return 'Exclusive markdowns on premium menswear. Grab your favourites before they sell out.';
    if (newArrivals) return 'The latest additions to our menswear collection, freshly curated for the modern gentleman.';
    if (categorySlug === 'formals') return 'Elevate your wardrobe with our refined formal collection — tailored shirts, trousers, and blazers.';
    if (categorySlug === 'occasionwear') return 'Dress for every occasion — weddings, parties, and celebrations with impeccable style.';
    return 'Browse tailored formalwear, modern casuals, premium fabric stories, and occasion pieces with refined filters built for fast discovery.';
  }, [isSale, newArrivals, categorySlug]);

  const { data: productData, isLoading, isError } = useGetProductsQuery({
    pageNumber,
    pageSize: 12,
    categoryId,
    search,
    minPrice,
    maxPrice,
    size,
    categorySlug,
    isSale,
  });

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setPageNumber(1);
    setSearchParams(next);
  };

  const applyPriceRange = (range: (typeof priceRanges)[number]) => {
    const next = new URLSearchParams(searchParams);
    if (range.minPrice === minPrice && range.maxPrice === maxPrice) {
      next.delete('minPrice');
      next.delete('maxPrice');
    } else {
      range.minPrice ? next.set('minPrice', String(range.minPrice)) : next.delete('minPrice');
      range.maxPrice ? next.set('maxPrice', String(range.maxPrice)) : next.delete('maxPrice');
    }
    setPageNumber(1);
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    setPageNumber(1);
    setSearchParams(next);
  };

  const filterPanel = (
    <div className="space-y-9">
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#111827]">Categories</h3>
          {(categoryId || minPrice || maxPrice || size) && (
            <button type="button" onClick={clearFilters} className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9d731e]">
              Clear
            </button>
          )}
        </div>
        <div className="grid gap-3">
          {allCategories.map((category) => (
            <label key={category.categoryId} className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#514b43]">
              <input
                type="checkbox"
                checked={categoryId === category.categoryId}
                onChange={() => updateParam('categoryId', categoryId === category.categoryId ? undefined : String(category.categoryId))}
                className="h-4 w-4 border-[#cfc2ad] text-[#9d731e] focus:ring-[#9d731e]"
              />
              {category.categoryName}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-5 text-[11px] font-black uppercase tracking-[0.28em] text-[#111827]">Price</h3>
        <div className="grid gap-3">
          {priceRanges.map((range) => (
            <label key={range.label} className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#514b43]">
              <input
                type="checkbox"
                checked={range.minPrice === minPrice && range.maxPrice === maxPrice}
                onChange={() => applyPriceRange(range)}
                className="h-4 w-4 border-[#cfc2ad] text-[#9d731e] focus:ring-[#9d731e]"
              />
              {range.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-5 text-[11px] font-black uppercase tracking-[0.28em] text-[#111827]">Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateParam('size', size === item ? undefined : item)}
              className={`h-10 w-11 border text-xs font-black transition-colors ${
                size === item
                  ? 'border-[#111827] bg-[#111827] text-white'
                  : 'border-[#d8cdbb] bg-white text-[#111827] hover:border-[#9d731e]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (isError) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#111827]">Collection unavailable</h2>
          <p className="mt-3 text-sm text-[#6f6659]">We could not load products. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfaf7]">
      <section className="border-b border-[#e8e0d0] bg-[#111827] text-[#f8f5ee]">
        <div className="container mx-auto py-12">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#d7b46a]">
              {search ? `Search: ${search}` : 'Menswear Collection'}
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl">
              {pageTitle}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#d8d2c8]">
              {pageSubtitle}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-[#e8e0d0] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex h-10 items-center gap-2 border border-[#d8cdbb] bg-white px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#111827] lg:hidden"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <div className="hidden items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#6f6659] lg:flex">
              <SlidersHorizontal className="h-4 w-4" />
              Refine
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7c7467]">
              {productData ? `${productData.totalCount} styles` : 'Loading styles'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#9d731e]">
              <Grid3X3 className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Grid view</span>
            </div>
            <button className="inline-flex h-10 items-center gap-2 border border-[#d8cdbb] bg-white px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#111827]">
              Sort: Newest
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-9 lg:grid-cols-[250px_1fr]">
          <aside className="hidden lg:block">{filterPanel}</aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-[3/4] bg-[#efe7da]" />
                    <div className="mt-4 h-3 w-3/4 bg-[#efe7da]" />
                    <div className="mt-3 h-3 w-1/2 bg-[#efe7da]" />
                  </div>
                ))}
              </div>
            ) : productData?.items.length ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 xl:grid-cols-3">
                {productData.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="border border-[#e8e0d0] bg-white p-10 text-center">
                <h2 className="text-xl font-black uppercase tracking-[0.08em] text-[#111827]">No styles found</h2>
                <p className="mt-3 text-sm text-[#6f6659]">Adjust your filters to explore more of the collection.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 h-11 bg-[#111827] px-7 text-[11px] font-black uppercase tracking-[0.22em] text-white"
                >
                  Clear filters
                </button>
              </div>
            )}

            {productData && productData.totalPages > 1 && (
              <div className="mt-14 flex justify-center gap-2">
                {Array.from({ length: productData.totalPages }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPageNumber(index + 1)}
                    className={`h-10 w-10 border text-[11px] font-black ${
                      pageNumber === index + 1
                        ? 'border-[#111827] bg-[#111827] text-white'
                        : 'border-[#d8cdbb] bg-white text-[#514b43] hover:border-[#111827]'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/45 lg:hidden"
            onClick={() => setIsFilterOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="h-full w-[86%] max-w-sm overflow-y-auto bg-[#fbfaf7] p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-[13px] font-black uppercase tracking-[0.28em] text-[#111827]">Filters</h2>
                <button type="button" onClick={() => setIsFilterOpen(false)} aria-label="Close filters">
                  <X className="h-6 w-6" />
                </button>
              </div>
              {filterPanel}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductListPage;
