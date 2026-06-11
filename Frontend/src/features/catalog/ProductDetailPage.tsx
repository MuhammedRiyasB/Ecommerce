import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useGetProductBySlugQuery, useGetProductsByCategoryQuery } from './catalogApiSlice';
import { MapPin, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/features/cart/cartSlice';
import { useAddToCartMutation } from '@/features/cart/cartApiSlice';
import WishlistHeartButton from '@/features/wishlist/WishlistHeartButton';
import { toast } from 'react-toastify';
import ProductCard from './components/ProductCard';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((state: { auth: { token: string | null } }) => state.auth.token);
  const { data: product, isLoading, isError } = useGetProductBySlugQuery(slug || '');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'invalid' | 'valid'>('idle');
  const [hasAddedToBag, setHasAddedToBag] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ size?: string; color?: string; pincode?: string }>({});
  const [addToCartServer, { isLoading: isAddingToBag }] = useAddToCartMutation();
  const sizeSectionRef = useRef<HTMLDivElement | null>(null);
  const colorSectionRef = useRef<HTMLDivElement | null>(null);
  const pincodeSectionRef = useRef<HTMLDivElement | null>(null);

  const { data: relatedProducts } = useGetProductsByCategoryQuery(
    { categoryId: product?.categoryId || 0, pageSize: 4 },
    { skip: !product?.categoryId }
  );

  const deliverablePincodes = useMemo(() => new Set(product?.deliverablePincodes ?? []), [product?.deliverablePincodes]);
  const colorOptions = useMemo(
    () => Array.from(new Set((product?.variants ?? []).map((variant) => variant.color))),
    [product?.variants]
  );
  const sizeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (product?.variants ?? [])
            .filter((variant) => !selectedColor || variant.color === selectedColor)
            .map((variant) => variant.size)
        )
      ),
    [product?.variants, selectedColor]
  );
  const selectedVariant = useMemo(
    () => product?.variants.find((variant) => variant.color === selectedColor && variant.size === selectedSize),
    [product?.variants, selectedColor, selectedSize]
  );
  const hasStock = (product?.quantity ?? 0) > 0;
  const selectedVariantInStock = selectedVariant ? selectedVariant.quantity > 0 : true;

  useEffect(() => {
    setHasAddedToBag(false);
  }, [selectedColor, selectedSize, pincode, product?.id]);

  useEffect(() => {
    if (colorOptions.length === 1 && !selectedColor) {
      setSelectedColor(colorOptions[0]);
    }
  }, [colorOptions, selectedColor]);

  useEffect(() => {
    if (selectedColor && sizeOptions.length === 1 && !selectedSize) {
      setSelectedSize(sizeOptions[0]);
    }
  }, [sizeOptions, selectedSize, selectedColor]);

  const galleryImages = useMemo(() => {
    const colorSpecificImages = selectedColor ? product?.imagesByColor?.[selectedColor] ?? [] : [];
    if (colorSpecificImages.length > 0) {
      return colorSpecificImages;
    }

    const sharedImages = product?.images?.length ? product.images : [];
    if (sharedImages.length > 0) {
      return sharedImages;
    }

    if (selectedColor) {
      const firstOtherColorImages = Object.values(product?.imagesByColor ?? {}).find((images) => images.length > 0);
      if (firstOtherColorImages?.length) {
        return firstOtherColorImages;
      }
    }

    return product?.image ? [product.image] : [];
  }, [product?.image, product?.images, product?.imagesByColor, selectedColor]);

  useEffect(() => {
    if (!galleryImages.length) {
      setSelectedImage('');
      return;
    }

    if (!selectedImage || !galleryImages.includes(selectedImage)) {
      setSelectedImage(galleryImages[0]);
    }
  }, [galleryImages, selectedImage]);

  const validateSelections = () => {
    const nextErrors: { size?: string; color?: string; pincode?: string } = {};

    if (!selectedColor) {
      nextErrors.color = 'Select a color to continue';
    }

    if (!selectedSize) {
      nextErrors.size = 'Select a size to continue';
    } else if (!selectedVariant) {
      nextErrors.size = 'This size is not available for the selected color';
    } else if (selectedVariant.quantity <= 0) {
      nextErrors.size = 'This size is out of stock';
    }

    if (!/^\d{6}$/.test(pincode)) {
      nextErrors.pincode = 'Enter a valid 6-digit pincode';
    } else if (!deliverablePincodes.has(pincode)) {
      nextErrors.pincode = 'Delivery is not available for this pincode';
    }

    setFieldErrors(nextErrors);

    if (nextErrors.color) {
      colorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    if (nextErrors.size) {
      sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    if (nextErrors.pincode) {
      pincodeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    return true;
  };

  const handlePincodeCheck = () => {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus('invalid');
      setFieldErrors((current) => ({ ...current, pincode: 'Enter a valid 6-digit pincode' }));
      return;
    }

    if (deliverablePincodes.has(pincode)) {
      setPincodeStatus('valid');
      setFieldErrors((current) => ({ ...current, pincode: undefined }));
      return;
    }

    setPincodeStatus('invalid');
    setFieldErrors((current) => ({ ...current, pincode: 'Delivery is not available for this pincode' }));
  };

  const handleAddToBag = async () => {
    if (!product || !validateSelections()) {
      return;
    }
    if (!selectedVariant) return;

    if (token) {
      try {
        await addToCartServer({
          productId: product.id,
          productVariantId: selectedVariant.id,
          quantity: 1,
          deliveryPincode: pincode,
        }).unwrap();
        setHasAddedToBag(true);
        toast.success('Added to bag');
      } catch (error: any) {
        toast.error(error?.data?.message || 'Unable to add this product to your bag');
      }
      return;
    }

    dispatch(addToCart({
      product,
      productVariantId: selectedVariant.id,
      selectedSize,
      selectedColor,
      deliveryPincode: pincode,
    }));
    setHasAddedToBag(true);
    toast.success('Added to bag');
  };

  const handleBuyNow = () => {
    if (!hasAddedToBag) {
      void handleAddToBag();
      return;
    }

    if (!token) {
      navigate(`${location.pathname}?auth=login&redirectTo=%2Fcheckout`);
      return;
    }

    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d7b46a] border-t-transparent" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#111827]">Product not found</h2>
          <p className="mt-3 text-sm text-[#6f6659]">The style you are looking for is no longer available.</p>
        </div>
      </div>
    );
  }

  const discountPercent = product.discount > 0 ? Math.round((product.discount / product.price) * 100) : 0;
  const finalPrice = product.price - product.discount;
  const selectedGalleryImage = galleryImages.find((image) => image === selectedImage) ?? galleryImages[0];

  return (
    <div className="bg-[#fbfaf7]">
      <div className="container mx-auto py-8">
        <nav className="mb-7 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a8174]">
          <Link to="/" className="hover:text-[#9d731e]">Home</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-[#9d731e]">Collection</Link>
          <span>/</span>
          <span className="text-[#111827]">{product.productName}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4 md:grid-cols-[88px_1fr]">
            <div className="hidden gap-3 md:grid md:auto-rows-min">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`aspect-[3/4] overflow-hidden border bg-white ${
                    selectedGalleryImage === image ? 'border-[#111827]' : 'border-[#e8e0d0]'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="relative aspect-[3/4] overflow-hidden bg-[#efe7da]">
              <img src={selectedGalleryImage} alt={product.productName} className="h-full w-full object-cover" />
              {discountPercent > 0 && (
                <span className="absolute left-4 top-4 bg-[#d7b46a] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#111827]">
                  {discountPercent}% off
                </span>
              )}
            </div>
          </div>

          <section className="bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-36 lg:self-start">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#9d731e]">Urbaniq Atelier</p>
            <h1 className="mt-3 text-2xl font-black uppercase leading-tight tracking-[0.06em] text-[#111827] sm:text-3xl">
              {product.productName}
            </h1>
            {product.categoryName && <p className="mt-2 text-sm font-medium text-[#7c7467]">{product.categoryName}</p>}

            <div className="mt-6 border-y border-[#eee6da] py-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black text-[#111827]">{formatPrice(finalPrice)}</span>
                {product.discount > 0 && (
                  <>
                    <span className="text-base font-medium text-[#9a9388] line-through">{formatPrice(product.price)}</span>
                    <span className="text-sm font-black uppercase tracking-[0.12em] text-[#9d731e]">{discountPercent}% off</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs font-medium text-[#6f6659]">MRP inclusive of all taxes</p>
            </div>

            <div ref={colorSectionRef} className="mt-6">
              <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#111827]">Select Colour</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      const nextColor = selectedColor === color ? '' : color;
                      setSelectedColor(nextColor);
                      setSelectedSize('');
                      setFieldErrors((current) => ({ ...current, color: undefined, size: undefined }));
                    }}
                    className={`min-h-11 border px-4 text-sm font-semibold transition-colors ${
                      selectedColor === color
                        ? 'border-[#111827] bg-[#111827] text-white'
                        : 'border-[#d8cdbb] bg-white text-[#111827] hover:border-[#9d731e]'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {fieldErrors.color && <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.color}</p>}
            </div>

            <div ref={sizeSectionRef} className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#111827]">Select Size</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => {
                  const variant = product.variants.find((entry) => entry.color === selectedColor && entry.size === size);
                  const isDisabled = !selectedColor || !variant || variant.quantity <= 0;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedSize((current) => (current === size ? '' : size));
                        setFieldErrors((current) => ({ ...current, size: undefined }));
                      }}
                      className={`h-12 min-w-12 border px-3 text-sm font-black transition-colors ${
                        selectedSize === size
                          ? 'border-[#111827] bg-[#111827] text-white'
                          : 'border-[#d8cdbb] bg-white text-[#111827] hover:border-[#9d731e]'
                      } ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {!selectedColor && <p className="mt-2 text-xs text-[#7c7467]">Select a colour first to see available sizes.</p>}
              {selectedVariant && (
                <p className="mt-2 text-xs text-[#7c7467]">
                  {selectedVariant.quantity > 0
                    ? `${selectedVariant.quantity} piece(s) left for this size and colour`
                    : 'This size is currently out of stock'}
                </p>
              )}
              {fieldErrors.size && <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.size}</p>}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={hasAddedToBag ? handleBuyNow : handleAddToBag}
                disabled={isAddingToBag || !hasStock || (Boolean(selectedVariant) && !selectedVariantInStock)}
                className="inline-flex h-[52px] items-center justify-center gap-2 bg-[#111827] px-8 text-[11px] font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#1f2740] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShoppingBag className="h-4 w-4" />
                {!hasStock
                  ? 'Out of stock'
                  : selectedVariant && !selectedVariantInStock
                    ? 'Variant sold out'
                    : hasAddedToBag
                      ? 'Buy now'
                      : isAddingToBag
                        ? 'Adding...'
                        : 'Add to bag'}
              </button>
              {product && (
                <WishlistHeartButton
                  productId={product.id}
                  size="md"
                  className="grid h-[52px] w-full place-items-center border border-[#d8cdbb] text-[#111827] hover:border-[#9d731e] sm:w-14"
                />
              )}
            </div>

            <div ref={pincodeSectionRef} className="mt-8 border-t border-[#eee6da] pt-6">
              <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-[#111827]">
                <MapPin className="h-4 w-4" />
                Delivery options
              </h2>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={pincode}
                  onChange={(event) => {
                    setPincode(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setPincodeStatus('idle');
                    setFieldErrors((current) => ({ ...current, pincode: undefined }));
                  }}
                  placeholder="Enter pincode"
                  className="h-11 min-w-0 flex-1 border border-[#d8cdbb] px-3 text-sm outline-none focus:border-[#9d731e]"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handlePincodeCheck}
                  className="border border-[#9d731e] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9d731e]"
                >
                  Check
                </button>
              </div>
              {fieldErrors.pincode && <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.pincode}</p>}
              {pincodeStatus === 'valid' && (
                <div className="mt-4 grid gap-3 text-sm text-[#514b43]">
                  <span className="flex items-center gap-3"><Truck className="h-4 w-4 text-[#9d731e]" /> Delivery is available for {pincode}</span>
                  <span className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#9d731e]" /> Authentic product and secure payment</span>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-[#eee6da] pt-6">
              <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#111827]">Product details</h2>
              <p className="mt-4 text-sm leading-7 text-[#514b43]">{product.description}</p>
              <dl className="mt-5 grid gap-px overflow-hidden bg-[#e8e0d0] text-sm sm:grid-cols-2">
                {product.material && (
                  <div className="flex justify-between gap-4 bg-[#fbfaf7] p-4">
                    <dt className="text-[#7c7467]">Material</dt>
                    <dd className="font-semibold text-[#111827]">{product.material}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 bg-[#fbfaf7] p-4">
                  <dt className="text-[#7c7467]">SKU</dt>
                  <dd className="font-semibold text-[#111827]">{product.sku}</dd>
                </div>
                <div className="flex justify-between gap-4 bg-[#fbfaf7] p-4">
                  <dt className="text-[#7c7467]">Colours</dt>
                  <dd className="font-semibold text-[#111827]">{colorOptions.join(', ')}</dd>
                </div>
                <div className="flex justify-between gap-4 bg-[#fbfaf7] p-4">
                  <dt className="text-[#7c7467]">Available sizes</dt>
                  <dd className="font-semibold text-[#111827]">{Array.from(new Set(product.variants.map((variant) => variant.size))).join(', ')}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        {relatedProducts && relatedProducts.items.length > 1 && (
          <section className="mt-16 border-t border-[#e8e0d0] pt-12">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#9d731e]">Complete the look</p>
                <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-[#111827]">Similar styles</h2>
              </div>
              <Link to="/catalog" className="text-[11px] font-black uppercase tracking-[0.22em] text-[#111827] luxury-link">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {relatedProducts.items
                .filter((item) => item.id !== product.id)
                .slice(0, 4)
                .map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
            </div>
          </section>
        )}
      </div>
      <section className="border-t border-[#e8e0d0] bg-white">
        <div className="container mx-auto grid gap-6 py-10 text-sm text-[#514b43] md:grid-cols-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#111827]">Delivery</p>
            <p className="mt-3 leading-6">Pincode is checked before adding to bag and rechecked during checkout.</p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#111827]">Returns</p>
            <p className="mt-3 leading-6">Eligible products can be returned from the order details page after delivery.</p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#111827]">Support</p>
            <p className="mt-3 leading-6">Order and payment help is available from your account help center.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;
