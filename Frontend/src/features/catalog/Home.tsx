import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Tag, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useGetHomeProductCardsQuery,
  useGetTopSellingProductsQuery,
  type HomeProductCard,
} from './catalogApiSlice';
import ProductCard from './components/ProductCard';

type HeroSlide = {
  title: string;
  eyebrow: string;
  copy: string;
  image: string;
  href: string;
  cta: string;
};



type HomeDisplayProduct = HomeProductCard;

const buildCatalogHref = (categoryId?: number) => (categoryId ? `/catalog?categoryId=${categoryId}` : '/catalog');

const getProductImage = (product?: { image?: string }) => product?.image;
const HOME_PRODUCT_CARD_COUNT = 200;
const NEW_ARRIVAL_COUNT = 10;

const scrollRail = (railId: string, direction: 'left' | 'right') => {
  const rail = document.getElementById(railId);
  rail?.scrollBy({ left: direction === 'left' ? -520 : 520, behavior: 'smooth' });
};

const Home: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const { data: homeProductCards, isLoading: isHomeCardsLoading } = useGetHomeProductCardsQuery(HOME_PRODUCT_CARD_COUNT);
  const { data: topSellingProductsData, isLoading: isTopSellingLoading } = useGetTopSellingProductsQuery(10);

  const products = useMemo(() => homeProductCards || [], [homeProductCards]);
  const newArrivalProducts = useMemo(() => products.slice(0, NEW_ARRIVAL_COUNT), [products]);
  const saleProducts = useMemo(() => products.filter((product) => product.discount > 0), [products]);
  const topSellingProducts = useMemo(() => (topSellingProductsData || []) as HomeProductCard[], [topSellingProductsData]);


  const heroSlides = useMemo<HeroSlide[]>(() => {
    const slideProducts = products
      .filter((product, index, source) => getProductImage(product) && source.findIndex((item) => item.id === product.id) === index)
      .slice(0, 5);

    if (!slideProducts.length) {
      return [
        {
          title: 'Formal Shirts',
          eyebrow: 'Catalog collection',
          copy: 'Crisp shirts and tailored essentials from your product categories, ready for office and evening dressing.',
          image: '/src/assets/hero.png',
          href: '/catalog',
          cta: 'Shop shirts',
        },
        {
          title: 'Sharp Trousers',
          eyebrow: 'Workwear edit',
          copy: 'Clean trousers and smart pairings selected for polished everyday menswear.',
          image: '/src/assets/hero.png',
          href: '/catalog',
          cta: 'Explore trousers',
        },
        {
          title: 'Blazer Edit',
          eyebrow: 'Occasion ready',
          copy: 'Structured layers and refined formal pieces for important meetings, events, and celebrations.',
          image: '/src/assets/hero.png',
          href: '/catalog',
          cta: 'View blazers',
        },
      ];
    }

    return slideProducts.map((product, index) => ({
      title: product.categoryName || product.productName,
      eyebrow: index === 0 ? 'New season edit' : product.subCategoryName || 'Featured collection',
      copy: `Premium ${product.categoryName || 'menswear'} selected from the latest Urbaniq catalog for polished everyday dressing.`,
      image: getProductImage(product)!,
      href: `/product/${product.slug}`,
      cta: index === 0 ? 'Shop now' : 'View product',
    }));
  }, [products]);

  useEffect(() => {
    if (activeSlide >= heroSlides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);



  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, HomeDisplayProduct[]>();

    products.forEach((product) => {
      const categoryName = product.categoryName || 'Featured Products';
      const currentProducts = grouped.get(categoryName) || [];
      grouped.set(categoryName, [...currentProducts, product]);
    });

    return Array.from(grouped.entries())
      .map(([categoryName, items]) => ({
        categoryName,
        items,
        categoryId: items[0]?.categoryId,
      }))
      .filter((section) => section.items.length > 0);
  }, [products]);

  const currentSlide = heroSlides[activeSlide] || heroSlides[0];
  const isProductLoading = isHomeCardsLoading;

  return (
    <div className="bg-[#fbfaf7]">
      <section className="relative overflow-hidden bg-[#111827]">
        <div className="relative min-h-[560px] md:min-h-[680px]">
          {currentSlide && (
            <>
              {/* Blurred background layer to maintain the ambient colors without stretching artifacts */}
              <img
                src={currentSlide.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center opacity-40 blur-3xl transition-opacity duration-500"
              />
              {/* Crisp foreground image: cover on mobile, contained on the right for desktop */}
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 md:left-1/3 md:w-2/3 md:object-contain md:object-right lg:left-1/2 lg:w-1/2 lg:pr-12"
              />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/95 via-[#111827]/80 to-[#111827]/30 md:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#111827]/90 to-transparent" />

          <div className="container relative mx-auto flex min-h-[560px] items-center py-16 md:min-h-[680px]">
            <div className="mx-auto max-w-2xl px-4 text-center md:mx-0 md:px-0 md:text-left text-white">
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.36em] text-[#d7b46a]">{currentSlide?.eyebrow}</p>
              <h1 className="mt-4 sm:mt-5 text-4xl sm:text-5xl md:text-7xl font-black uppercase leading-[1.1] md:leading-[0.94] tracking-[0.06em]">
                {currentSlide?.title}
              </h1>
              <p className="mx-auto mt-4 sm:mt-5 max-w-xl text-sm sm:text-base md:text-lg font-medium leading-6 sm:leading-7 text-[#f1eadf] md:mx-0">
                {currentSlide?.copy}
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:justify-start">
                <Link
                  to={currentSlide?.href || '/catalog'}
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-3 bg-[#d7b46a] px-8 text-[11px] font-black uppercase tracking-[0.22em] text-[#111827] transition-colors hover:bg-[#e2c77f]"
                >
                  {currentSlide?.cta || 'Shop now'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/catalog"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center border border-white/60 px-8 text-[11px] font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-[#111827]"
                >
                  View all products
                </Link>
              </div>
            </div>
          </div>

          {heroSlides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous banner"
                onClick={() => setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/84 text-[#111827] shadow-lg transition hover:bg-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next banner"
                onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)}
                className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/84 text-[#111827] shadow-lg transition hover:bg-white"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-3">
                {heroSlides.map((slide, index) => (
                  <button
                    key={`${slide.title}-${index}`}
                    type="button"
                    aria-label={`Show banner ${index + 1}`}
                    onClick={() => setActiveSlide(index)}
                    className={`h-1.5 rounded-full transition-all ${activeSlide === index ? 'w-12 bg-[#d7b46a]' : 'w-8 bg-white/72'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>



      <section className="bg-[#fbfaf7] py-14 sm:py-16">
        <div className="container mx-auto">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.32em] text-[#9d731e]">
                <Sparkles className="h-4 w-4" />
                New arrivals
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-[#111827]">Just In</h2>
            </div>
            <Link to="/catalog" className="text-[11px] font-black uppercase tracking-[0.24em] text-[#111827] luxury-link">
              Shop all new arrivals
            </Link>
          </div>

          <ProductRail
            railId="new-arrivals"
            products={newArrivalProducts}
            isLoading={isProductLoading}
            emptyText="New arrivals will appear here after products are added."
          />
        </div>
      </section>

      {saleProducts.length > 0 && (
        <section className="border-y border-[#e8e0d0] bg-white py-14 sm:py-16">
          <div className="container mx-auto">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.32em] text-[#b42318]">
                  <Tag className="h-4 w-4" />
                  Sale
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-[#111827]">Limited Offers</h2>
              </div>
              <Link to="/catalog?isSale=true" className="text-[11px] font-black uppercase tracking-[0.24em] text-[#111827] luxury-link">
                View sale products
              </Link>
            </div>

            <ProductRail railId="sale-products" products={saleProducts} isLoading={isProductLoading} emptyText="Sale products will appear here when discounts are active." />
          </div>
        </section>
      )}

      {topSellingProducts.length > 0 && (
        <section className="border-y border-[#e8e0d0] bg-white py-14 sm:py-16">
          <div className="container mx-auto">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.32em] text-[#b42318]">
                  <Flame className="h-4 w-4" />
                  Trending
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-[#111827]">Top Selling Products</h2>
              </div>
              <Link to="/catalog" className="text-[11px] font-black uppercase tracking-[0.24em] text-[#111827] luxury-link">
                View collection
              </Link>
            </div>

            <ProductRail railId="top-selling-products" products={topSellingProducts} isLoading={isTopSellingLoading} emptyText="Trending products will appear here." />
          </div>
        </section>
      )}

      <section className="bg-[#fbfaf7] py-14 sm:py-16">
        <div className="container mx-auto space-y-16">
          {productsByCategory.map((section) => (
            <div key={section.categoryName}>
              <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#e8e0d0] pb-5 md:flex-row md:items-end">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#9d731e]">Shop by category</p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-[#111827]">{section.categoryName}</h2>
                </div>
                <Link
                  to={buildCatalogHref(section.categoryId)}
                  className="text-[11px] font-black uppercase tracking-[0.24em] text-[#111827] luxury-link"
                >
                  View all
                </Link>
              </div>

              <ProductRail
                railId={`category-${section.categoryName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                products={section.items}
                isLoading={isProductLoading}
                emptyText={`No ${section.categoryName} products found yet.`}
              />
            </div>
          ))}

          {!productsByCategory.length && !isProductLoading && (
            <div className="border border-[#e8e0d0] bg-white p-8 text-center">
              <p className="text-sm font-semibold text-[#6f6659]">Products added from the admin catalog will appear on this page automatically.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const ProductRail: React.FC<{ railId: string; products: HomeDisplayProduct[]; isLoading: boolean; emptyText: string }> = ({
  railId,
  products,
  isLoading,
  emptyText,
}) => {
  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="w-[260px] shrink-0 animate-pulse sm:w-[300px]">
            <div className="aspect-[3/4] bg-[#efe7da]" />
            <div className="mt-4 h-3 w-2/3 bg-[#efe7da]" />
            <div className="mt-3 h-3 w-1/3 bg-[#efe7da]" />
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="border border-[#e8e0d0] bg-white px-6 py-8">
        <p className="text-sm font-semibold text-[#6f6659]">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Scroll products left"
        onClick={() => scrollRail(railId, 'left')}
        className="absolute -left-3 top-[38%] z-10 hidden h-12 w-12 place-items-center rounded-full bg-white text-[#111827] shadow-lg transition hover:bg-[#f8f5ee] lg:grid"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <div id={railId} className="flex snap-x gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none]">
        {products.map((product) => (
          <div key={product.id} className="w-[260px] shrink-0 snap-start sm:w-[300px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Scroll products right"
        onClick={() => scrollRail(railId, 'right')}
        className="absolute -right-3 top-[38%] z-10 hidden h-12 w-12 place-items-center rounded-full bg-white text-[#111827] shadow-lg transition hover:bg-[#f8f5ee] lg:grid"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Home;
