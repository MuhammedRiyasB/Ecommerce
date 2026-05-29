import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  useGetCartQuery,
  useRemoveFromCartMutation,
  useIncreaseQuantityMutation,
  useDecreaseQuantityMutation,
} from './cartApiSlice';
import { removeFromCart, selectCartCount, selectCartItems, selectCartTotal, updateQuantity } from './cartSlice';
import type { RootState } from '@/app/store';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const { data: serverCart, isLoading } = useGetCartQuery(undefined, { skip: !token });
  const localItems = useSelector(selectCartItems);
  const localTotal = useSelector(selectCartTotal);
  const localCount = useSelector(selectCartCount);

  const [removeServerItem] = useRemoveFromCartMutation();
  const [increaseQty] = useIncreaseQuantityMutation();
  const [decreaseQty] = useDecreaseQuantityMutation();

  const isServerCart = Boolean(token && serverCart);
  const activeServerCart = serverCart!;
  const items = isServerCart
    ? activeServerCart.items.map((item) => ({
        cartItemId: item.cartItemId,
        productId: item.productId,
        slug: item.slug ?? item.productId,
        name: item.productName,
        image: item.image,
        size: item.size,
        color: item.color,
        price: item.price,
        discount: item.discount,
        quantity: item.quantity,
        deliveryPincode: item.deliveryPincode,
      }))
    : localItems.map((item) => ({
        cartItemId: item.cartItemKey,
        productId: item.id,
        slug: item.slug,
        name: item.productName,
        image: item.image,
        size: item.selectedSize,
        color: item.selectedColor,
        price: item.price,
        discount: item.discount,
        quantity: item.cartQuantity,
        deliveryPincode: item.deliveryPincode,
      }));

  const totalAmount = isServerCart ? activeServerCart.finalAmount : localTotal;
  const totalItems = isServerCart
    ? activeServerCart.items.reduce((sum, item) => sum + item.quantity, 0)
    : localCount;

  const handleRemove = async (cartItemId: string) => {
    if (isServerCart) {
      try {
        await removeServerItem(cartItemId).unwrap();
        toast.success('Item removed');
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to remove item');
      }
      return;
    }

    dispatch(removeFromCart(cartItemId));
  };

  const handleIncrease = async (cartItemId: string) => {
    if (isServerCart) {
      try {
        await increaseQty({ cartItemId }).unwrap();
      } catch (err: any) {
        toast.error(err?.data?.message || 'Cannot increase quantity');
      }
      return;
    }

    const item = localItems.find((entry) => entry.cartItemKey === cartItemId);
    if (item) {
      dispatch(updateQuantity({ cartItemKey: cartItemId, quantity: item.cartQuantity + 1 }));
    }
  };

  const handleDecrease = async (cartItemId: string) => {
    if (isServerCart) {
      try {
        await decreaseQty({ cartItemId }).unwrap();
      } catch (err: any) {
        toast.error(err?.data?.message || 'Cannot decrease quantity');
      }
      return;
    }

    const item = localItems.find((entry) => entry.cartItemKey === cartItemId);
    if (item) {
      dispatch(updateQuantity({ cartItemKey: cartItemId, quantity: item.cartQuantity - 1 }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShoppingBag className="mb-6 h-20 w-20 text-gray-200" />
        <h2 className="mb-2 text-2xl font-black uppercase tracking-tight text-gray-900">Your Bag is Empty</h2>
        <p className="mb-8 max-w-sm text-sm text-gray-500">
          Looks like you have not added anything to your bag yet. Start shopping to fill it up.
        </p>
        <Link
          to="/catalog"
          className="bg-teal-600 px-10 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-teal-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
            Shopping Bag <span className="text-lg font-medium normal-case text-gray-400">({totalItems} items)</span>
          </h1>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-4">
            {items.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 border border-gray-100 bg-white p-4 sm:gap-6 sm:p-6">
                <Link to={`/product/${item.slug}`} className="shrink-0">
                  <img
                    src={item.image || 'https://via.placeholder.com/120x150'}
                    alt={item.name}
                    className="h-32 w-24 bg-gray-50 object-cover sm:h-36 sm:w-28"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link to={`/product/${item.slug}`}>
                    <h3 className="truncate text-sm font-bold text-gray-900 transition-colors hover:text-teal-600">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Size: <strong className="text-gray-700">{item.size}</strong></span>
                    <span>Color: <strong className="text-gray-700">{item.color}</strong></span>
                    {item.deliveryPincode && <span>Delivery pincode: <strong className="text-gray-700">{item.deliveryPincode}</strong></span>}
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-base font-black text-gray-900">
                      Rs. {(item.price - item.discount).toLocaleString()}
                    </span>
                    {item.discount > 0 && (
                      <>
                        <span className="text-xs text-gray-400 line-through">Rs. {item.price.toLocaleString()}</span>
                        <span className="text-xs font-bold text-orange-500">
                          ({Math.round((item.discount / item.price) * 100)}% OFF)
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase text-gray-500">Qty:</span>
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() => handleDecrease(item.cartItemId)}
                        disabled={item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-gray-50 disabled:opacity-30"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="flex h-8 w-10 items-center justify-center border-x border-gray-200 text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncrease(item.cartItemId)}
                        className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-gray-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(item.cartItemId)}
                  className="self-start p-2 text-gray-400 transition-colors hover:text-red-500"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="shrink-0 lg:w-96">
            <div className="sticky top-24 border border-gray-100 bg-white p-6">
              <h3 className="mb-6 border-b border-gray-100 pb-4 text-xs font-black uppercase tracking-widest text-gray-900">
                Price Details ({totalItems} Items)
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total MRP</span>
                  <span className="font-medium">Rs. {items.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount on MRP</span>
                  <span className="font-medium">-Rs. {items.reduce((sum, item) => sum + item.discount * item.quantity, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-4 text-base font-black text-gray-900">
                  <span>Total Amount</span>
                  <span>Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!token) {
                    navigate('/login', { state: { redirectTo: '/checkout' } });
                  } else {
                    navigate('/checkout');
                  }
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-teal-600 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-teal-700"
              >
                {token ? 'Checkout' : 'Login to Continue'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
