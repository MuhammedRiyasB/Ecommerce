import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { CartResponse } from '@/features/cart/cartApiSlice';
import type { Address } from '../addressApiSlice';

interface OrderSummaryProps {
  cart: CartResponse;
  address: Address;
  onBack: () => void;
  onContinue: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, address, onBack, onContinue }) => {
  const totalMRP = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = cart.items.reduce((sum, item) => sum + item.discount * item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="border border-gray-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Delivery Address</h3>
          <button onClick={onBack} className="text-xs font-bold uppercase tracking-wider text-teal-600 hover:underline">
            Change
          </button>
        </div>
        <div className="text-sm text-gray-700">
          <p className="font-bold">{address.fullName}</p>
          <p>{address.houseName}, {address.place}</p>
          <p>{address.postOffice}, {address.landMark}</p>
          <p>Pincode: {address.pincode} | Phone: {address.phoneNumber}</p>
        </div>
      </div>

      <div className="border border-gray-100 bg-white p-6">
        <h3 className="mb-5 text-xs font-black uppercase tracking-widest text-gray-900">
          Order Items ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})
        </h3>
        <div className="divide-y divide-gray-100">
          {cart.items.map((item) => (
            <div key={item.cartItemId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <img
                src={item.image || 'https://via.placeholder.com/80x100'}
                alt={item.productName}
                className="h-20 w-16 shrink-0 bg-gray-50 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{item.productName}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                </p>
                {item.deliveryPincode && (
                  <p className="mt-1 text-xs font-medium text-gray-500">Selected pincode: {item.deliveryPincode}</p>
                )}
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-sm font-black">Rs. {item.totalPrice.toLocaleString()}</span>
                  {item.discount > 0 && (
                    <span className="text-xs text-gray-400 line-through">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-100 bg-white p-6">
        <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-900">Price Details</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total MRP</span>
            <span>Rs. {totalMRP.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Discount on MRP</span>
            <span>-Rs. {totalDiscount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-medium text-green-600">FREE</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-black text-gray-900">
            <span>Total Amount</span>
            <span>Rs. {cart.finalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 border border-gray-300 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-600 transition-colors hover:border-gray-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onContinue}
          className="flex-1 bg-teal-600 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-teal-700"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
