import React, { useMemo, useState } from 'react';
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Share2 } from 'lucide-react';
import type { Product } from '../catalogApiSlice';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/features/cart/cartSlice';
import { toast } from 'react-toastify';
import { useAddToWishlistMutation } from '@/features/wishlist/wishlistApiSlice';

interface ProductInfoProps {
  product: Product;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const dispatch = useDispatch();
  const [addToWishlist] = useAddToWishlistMutation();

  const discountPercent = Math.round((product.discount / product.price) * 100);
  const effectivePrice = product.price - product.discount;
  const colors = useMemo(() => Array.from(new Set(product.variants.map((variant) => variant.color))), [product.variants]);
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.filter((variant) => !selectedColor || variant.color === selectedColor).map((variant) => variant.size))),
    [product.variants, selectedColor]
  );
  const selectedVariant = product.variants.find((variant) => variant.color === selectedColor && variant.size === selectedSize);

  const handleAddToCart = () => {
    if (!selectedColor) {
      toast.error('Please select a color first!', { position: 'top-center' });
      return;
    }

    if (!selectedSize || !selectedVariant) {
      toast.error('Please select a valid size first!', { position: 'top-center' });
      return;
    }

    dispatch(addToCart({
      product,
      productVariantId: selectedVariant.id,
      selectedSize,
      selectedColor,
      deliveryPincode: pincode,
    }));
    toast.success('Product added to bag!');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-teal-600">
            Urbaniq Premium
          </h2>
          <button className="rounded-full p-2 transition-colors hover:bg-gray-50">
            <Share2 className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <h1 className="text-2xl font-medium leading-tight text-gray-800">
          {product.productName}
        </h1>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black text-gray-900">
            Rs. {effectivePrice.toLocaleString()}
          </span>
          {product.discount > 0 && (
            <>
              <span className="text-xl text-gray-400 line-through">
                Rs. {product.price.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-yellow-600">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600">
          inclusive of all taxes
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
          Select Color
        </h3>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor((current) => (current === color ? null : color));
                setSelectedSize(null);
              }}
              className={`border-2 px-4 py-3 text-sm font-black transition-all ${
                selectedColor === color
                  ? 'border-teal-600 bg-teal-50 text-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
            Select Size
          </h3>
          <button className="text-xs font-bold uppercase text-teal-600 hover:underline">
            Size Guide
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize((current) => (current === size ? null : size))}
              className={`flex h-14 w-14 items-center justify-center border-2 text-sm font-black transition-all ${
                selectedSize === size
                  ? 'border-teal-600 bg-teal-50 text-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <button
          onClick={handleAddToCart}
          className="flex flex-1 items-center justify-center gap-3 bg-teal-600 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-teal-700"
        >
          <ShoppingBag className="h-5 w-5" />
          Add to Bag
        </button>
        <button
          onClick={async () => {
            try {
              await addToWishlist(product.id).unwrap();
              toast.success('Product added to wishlist');
            } catch (err: any) {
              if (err?.status === 401) {
                toast.error('Please login to add to wishlist');
              } else {
                toast.error(err?.data?.message || 'Failed to add to wishlist');
              }
            }
          }}
          className="flex flex-1 items-center justify-center gap-3 border-2 border-gray-200 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all hover:border-gray-900"
        >
          <Heart className="h-5 w-5" />
          Wishlist
        </button>
      </div>

      <div className="space-y-4 border-t border-gray-100 pt-8">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-900">
          <Truck className="h-5 w-5" />
          Delivery Details
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="flex-1 border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-teal-600/20"
          />
          <button className="px-4 text-xs font-black uppercase text-teal-600 hover:underline">
            Check
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-8">
        <div className="flex flex-col items-center space-y-1 text-center">
          <RotateCcw className="h-6 w-6 text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">30 Day Return</span>
        </div>
        <div className="flex flex-col items-center space-y-1 text-center">
          <ShieldCheck className="h-6 w-6 text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Secure Payment</span>
        </div>
        <div className="flex flex-col items-center space-y-1 text-center">
          <Truck className="h-6 w-6 text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Free Shipping</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
