import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import WishlistHeartButton from '@/features/wishlist/WishlistHeartButton';
import { toast } from 'react-toastify';
import { catalogApiSlice } from '../catalogApiSlice';

export interface ProductCardProduct {
  id: string;
  productName: string;
  slug: string;
  quantity: number;
  price: number;
  discount: number;
  image: string;
  color?: string | null;
}

interface ProductCardProps {
  product: ProductCardProduct;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const buildCloudinaryCardImage = (imageUrl: string, width: number) => {
  if (!imageUrl.includes('/image/upload/')) {
    return imageUrl;
  }

  const transformation = `f_auto,q_auto:eco,c_fill,g_auto,w_${width},h_${Math.round(width * 4 / 3)}`;
  return imageUrl.replace('/image/upload/', `/image/upload/${transformation}/`);
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const prefetchProduct = catalogApiSlice.usePrefetch('getProductBySlug');
  const discountPercent = product.price > 0 ? Math.round((product.discount / product.price) * 100) : 0;
  const effectivePrice = product.price - product.discount;
  const cardImage = buildCloudinaryCardImage(product.image, 420);

  const prefetchProductDetail = () => {
    prefetchProduct(product.slug, { ifOlderThan: 60 });
  };

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toast.info('Choose size, color, and delivery pincode on the product page before adding to bag.', {
      position: 'bottom-right',
      autoClose: 2200,
    });
    navigate(`/product/${product.slug}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group bg-white"
    >
      <Link
        to={`/product/${product.slug}`}
        onFocus={prefetchProductDetail}
        onPointerEnter={prefetchProductDetail}
        onTouchStart={prefetchProductDetail}
        className="block"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#efe7da]">
          <img
            src={cardImage}
            srcSet={`${buildCloudinaryCardImage(product.image, 320)} 320w, ${cardImage} 420w, ${buildCloudinaryCardImage(product.image, 640)} 640w`}
            sizes="(min-width: 640px) 300px, 260px"
            alt={product.productName}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {discountPercent > 0 && (
              <span className="bg-[#d7b46a] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#111827]">
                {discountPercent}% off
              </span>
            )}
            {product.quantity <= 5 && (
              <span className="bg-[#111827] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                Limited
              </span>
            )}
          </div>

          <WishlistHeartButton
            productId={product.id}
            size="sm"
            stopLinkNavigation
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/92 text-[#111827] shadow-sm hover:text-[#9d731e]"
          />

          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-[#111827]/95 p-3 transition-transform duration-300 group-hover:translate-y-0">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex h-11 w-full items-center justify-center gap-2 border border-[#d7b46a] text-[11px] font-black uppercase tracking-[0.2em] text-[#f8f5ee] transition-colors hover:bg-[#d7b46a] hover:text-[#111827]"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to bag
            </button>
          </div>
        </div>

        <div className="border-x border-b border-[#eee6da] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9d731e]">Urbaniq</p>
            {product.color && <span className="text-[11px] font-semibold text-[#7c7467]">{product.color}</span>}
          </div>
          <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#111827] transition-colors group-hover:text-[#9d731e]">
            {product.productName}
          </h3>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-base font-black text-[#111827]">{formatPrice(effectivePrice)}</span>
            {product.discount > 0 && (
              <span className="text-sm font-medium text-[#9a9388] line-through">{formatPrice(product.price)}</span>
            )}
          </div>
          <p className="mt-1 text-[11px] font-medium text-[#7c7467]">MRP inclusive of all taxes</p>
        </div>
      </Link>
    </motion.article>
  );
};

export default ProductCard;
