import React from 'react';
import { ArrowRight, Award, Ruler, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetRecentProductsQuery, useGetTopSellingProductsQuery } from './catalogApiSlice';
import ProductCard from './components/ProductCard';

const occasionEdits = [
  {
    title: 'Boardroom Formals',
    copy: 'Crisp shirts, sharp trousers, and jackets cut for weekday authority.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200',
  },
  {
    title: 'Ceremony Ready',
    copy: 'Elevated occasionwear for weddings, receptions, and refined evenings.',
    image: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&q=80&w=1200',
  },
  {
    title: 'Weekend Linen',
    copy: 'Airy textures, relaxed collars, and breathable tailoring.',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=1200',
  },
];

const serviceHighlights = [
  { icon: Truck, title: 'Express Delivery', copy: 'Priority shipping on premium edits' },
  { icon: Ruler, title: 'Tailored Fit Notes', copy: 'Size guidance for formal silhouettes' },
  { icon: ShieldCheck, title: 'Secure Checkout', copy: 'Encrypted payments and protected sessions' },
  { icon: Award, title: 'Quality Promise', copy: 'Curated fabrics and durable finishing' },
];

const Home: React.FC = () => {
  const { data: recentProducts, isLoading: isRecentLoading } = useGetRecentProductsQuery({ pageSize: 12 });
  const { data: topSellingProducts, isLoading: isTopSellingLoading } = useGetTopSellingProductsQuery(8);

  return (
    <div className="bg-[#fbfaf7]">
      <section className="relative min-h-[calc(100vh-8.75rem)] overflow-hidden bg-[#111827]">
        <img
          src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=85&w=2200"
          alt="Premium menswear collection"
          className="absolute inset-0 h-full w-full object-cover opacity-72"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/95 via-[#111827]/58 to-transparent" />
        <div className="container relative mx-auto flex min-h-[calc(100vh-8.75rem)] items-center py-20">
          <div className="max-w-2xl text-[#f8f5ee]">
            <p className="text-[11px] font-black uppercase tracking-[0.42em] text-[#d7b46a]">
              New season formalwear
            </p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-[0.92] tracking-[0.08em] sm:text-7xl lg:text-8xl">
              The Modern Gentleman
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#e4ded3] sm:text-lg">
              Build a wardrobe of tailored shirts, structured blazers, clean trousers, and occasionwear designed for premium everyday confidence.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/catalog"
                className="inline-flex h-12 items-center gap-3 bg-[#d7b46a] px-8 text-[11px] font-black uppercase tracking-[0.22em] text-[#111827] transition-colors hover:bg-[#e2c77f]"
              >
                Shop new arrivals
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/catalog"
                className="inline-flex h-12 items-center border border-white/60 px-8 text-[11px] font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-[#111827]"
              >
                Explore sale
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e8e0d0] bg-[#f3ecdf]">
        <div className="container mx-auto grid gap-px bg-[#e1d5c2] md:grid-cols-4">
          {serviceHighlights.map((item) => (
            <div key={item.title} className="flex items-start gap-4 bg-[#f3ecdf] px-5 py-7">
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#9d731e]" />
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#111827]">{item.title}</h3>
                <p className="mt-2 text-sm leading-5 text-[#6f6659]">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto py-16 sm:py-20">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#e8e0d0] pb-7 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#9d731e]">Shop by occasion</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-[#111827] sm:text-4xl">
              Curated Menswear Edits
            </h2>
          </div>
          <Link to="/catalog" className="text-[11px] font-black uppercase tracking-[0.24em] text-[#111827] luxury-link">
            View complete collection
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {occasionEdits.map((edit) => (
            <Link key={edit.title} to="/catalog" className="group relative min-h-[470px] overflow-hidden bg-[#111827]">
              <img
                src={edit.image}
                alt={edit.title}
                className="absolute inset-0 h-full w-full object-cover opacity-82 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/88 via-[#111827]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <h3 className="text-2xl font-black uppercase tracking-[0.08em]">{edit.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#eee7dc]">{edit.copy}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#d7b46a]">
                  Shop edit
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container mx-auto">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#9d731e]">New Arrivals</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-[#111827] sm:text-4xl">
                Recent Additions
              </h2>
            </div>
            <Link to="/catalog" className="text-[11px] font-black uppercase tracking-[0.24em] text-[#111827] luxury-link">
              Shop all new arrivals
            </Link>
          </div>

          {isRecentLoading ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[3/4] bg-[#efe7da]" />
                  <div className="mt-4 h-3 w-2/3 bg-[#efe7da]" />
                  <div className="mt-3 h-3 w-1/3 bg-[#efe7da]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {recentProducts?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[#e8e0d0] bg-[#fbfaf7] py-16 sm:py-20">
        <div className="container mx-auto">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#9d731e]">Customer favorites</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-[#111827] sm:text-4xl">
                Highest Selling
              </h2>
            </div>
            <Link to="/catalog" className="text-[11px] font-black uppercase tracking-[0.24em] text-[#111827] luxury-link">
              Shop all products
            </Link>
          </div>

          {isTopSellingLoading ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[3/4] bg-[#efe7da]" />
                  <div className="mt-4 h-3 w-2/3 bg-[#efe7da]" />
                  <div className="mt-3 h-3 w-1/3 bg-[#efe7da]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {topSellingProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto py-16 sm:py-20">
        <div className="grid overflow-hidden bg-[#111827] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-8 text-[#f8f5ee] sm:p-12 lg:p-16">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#d7b46a]">Sale preview</p>
            <h2 className="mt-5 text-4xl font-black uppercase leading-none tracking-[0.08em] sm:text-6xl">
              Up to 50% off
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#d8d2c8]">
              End-of-season prices on refined shirts, formal trousers, blazers, and wardrobe staples while selected sizes last.
            </p>
            <Link
              to="/catalog"
              className="mt-9 inline-flex h-12 items-center bg-[#f8f5ee] px-8 text-[11px] font-black uppercase tracking-[0.22em] text-[#111827]"
            >
              Shop sale
            </Link>
          </div>
          <img
            src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&q=85&w=1600"
            alt="Formal clothing sale edit"
            className="h-full min-h-[360px] w-full object-cover"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
