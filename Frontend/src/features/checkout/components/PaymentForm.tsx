import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, CreditCard, Lock, ShieldCheck, XCircle } from 'lucide-react';
import { useCreatePaymentIntentMutation, useGetPaymentConfigQuery, useVerifyPaymentMutation } from '../paymentApiSlice';
import { usePlaceOrderMutation } from '@/features/orders/orderApiSlice';
import type { CartResponse } from '@/features/cart/cartApiSlice';
import type { Address } from '../addressApiSlice';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';

export interface OrderSuccessDetails {
  cart: CartResponse;
  address?: Address | null;
  paymentMethod: 'card' | 'cod';
}

interface PaymentFormProps {
  cart: CartResponse;
  addressId: string;
  address?: Address | null;
  onBack: () => void;
  onOrderSuccess: (details: OrderSuccessDetails) => void;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({ cart, addressId, address, onBack, onOrderSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [cardErrors, setCardErrors] = useState<{ number: string | null; expiry: string | null; cvc: string | null }>({
    number: null,
    expiry: null,
    cvc: null,
  });

  const validateCardFields = (): boolean => {
    if (cardErrors.number || cardErrors.expiry || cardErrors.cvc) {
      toast.error('Please fix the errors in your card details.');
      return false;
    }
    return true;
  };

  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [placeOrder] = usePlaceOrderMutation();

  const finalAmount = cart.finalAmount;

  const handlePayment = async () => {
    setFailureMessage(null);
    const activeStripe = stripe;
    const activeElements = elements;

    if (paymentMethod === 'card') {
      if (!activeStripe || !activeElements) {
        toast.error("Stripe hasn't loaded yet. Please wait a moment and try again.");
        return;
      }
      if (!validateCardFields()) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      if (paymentMethod === 'card') {
        const cardElement = activeElements!.getElement(CardNumberElement);
        if (!cardElement) throw new Error('Card element not found');

        const intentResult = await createPaymentIntent({ amount: finalAmount }).unwrap();
        const clientSecret = intentResult.data?.clientSecret;
        if (!clientSecret) {
          toast.error('Could not start payment. Please try again.');
          setIsProcessing(false);
          return;
        }

        const { error, paymentIntent } = await activeStripe!.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error || !paymentIntent) {
          const message =
            error?.code === 'incomplete_number'
              ? 'Your card number is incomplete. Please enter the full card number.'
              : error?.code === 'invalid_number' || error?.code === 'incorrect_number'
                ? 'The card number you entered is invalid. Please check and try again.'
                : error?.message || 'Payment failed.';
          setFailureMessage(message);
          setFailureMessage(message);
          toast.error(message);
          setIsProcessing(false);
          return;
        }

        const verification = await verifyPayment({ paymentIntentId: paymentIntent.id }).unwrap();
        if (!verification.data?.isSuccessful) {
          throw new Error('Payment verification failed. Please contact support if money was deducted.');
        }

        await placeOrder({
          addressId,
          transactionId: paymentIntent.id,
          paymentMethod: 'card',
        }).unwrap();

        onOrderSuccess({
          cart: { ...cart, items: cart.items.map((item) => ({ ...item })) },
          address,
          paymentMethod: 'card',
        });
      } else {
        await placeOrder({
          addressId,
          transactionId: `COD_${Date.now()}`,
          paymentMethod: 'cod',
        }).unwrap();

        onOrderSuccess({
          cart: { ...cart, items: cart.items.map((item) => ({ ...item })) },
          address,
          paymentMethod: 'cod',
        });
      }
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Payment failed. Please try again.';
      setFailureMessage(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (failureMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-red-100 bg-white p-8 text-center sm:p-12"
      >
        <motion.div
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50"
        >
          <XCircle className="h-10 w-10 text-red-500" />
        </motion.div>
        <h2 className="mb-2 text-2xl font-black uppercase tracking-tight text-gray-900">Payment Failed</h2>
        <p className="mx-auto mb-8 max-w-sm text-sm text-gray-500">{failureMessage}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => setFailureMessage(null)}
            className="bg-teal-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-teal-700"
          >
            Try Again
          </button>
          <button
            onClick={onBack}
            className="border border-gray-300 px-8 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 transition-colors hover:border-gray-400"
          >
            Review Order
          </button>
        </div>
      </motion.div>
    );
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        '::placeholder': {
          color: '#9ca3af',
        },
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <div className="space-y-6">
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-teal-100 bg-white p-6 text-center shadow-sm"
          role="status"
          aria-live="polite"
        >
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <motion.span
              animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.05, 0.35] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-teal-200"
            />
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-full border-2 border-teal-600 border-t-transparent"
            />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
            {paymentMethod === 'cod' ? 'Placing your order' : 'Processing secure payment'}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500">
            Please keep this page open while we confirm the transaction and create your order.
          </p>
        </motion.div>
      )}

      <div className="border border-gray-100 bg-white p-6">
        <h3 className="mb-5 text-xs font-black uppercase tracking-widest text-gray-900">Choose Payment Method</h3>
        <div className="space-y-3">
          <div
            className={`border transition-colors ${
              paymentMethod === 'card' ? 'border-teal-600 bg-teal-50/30' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <label className="flex cursor-pointer items-start gap-3 sm:gap-4 p-3 sm:p-4">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'card'}
                onChange={() => {
                  setPaymentMethod('card');
                  setCardErrors({ number: null, expiry: null, cvc: null });
                }}
                className="mt-1 accent-teal-600"
              />
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-bold text-gray-900">Credit / Debit Card</p>
                </div>
                <p className="text-xs text-gray-500">Secure payment via Stripe</p>
              </div>
            </label>

            {paymentMethod === 'card' && (
              <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 pl-9 sm:pl-10">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Card Number</label>
                    <div
                      className={`rounded-sm border bg-white p-3 sm:p-4 transition-colors ${
                        cardErrors.number ? 'border-red-400' : 'border-gray-200'
                      }`}
                    >
                      <CardNumberElement 
                        options={cardElementOptions} 
                        onChange={(e) => setCardErrors(p => ({ ...p, number: e.error?.message || null }))} 
                      />
                    </div>
                    {cardErrors.number && <p className="mt-1.5 text-xs font-medium text-red-600">{cardErrors.number}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Expiration Date</label>
                      <div
                        className={`rounded-sm border bg-white p-3 sm:p-4 transition-colors ${
                          cardErrors.expiry ? 'border-red-400' : 'border-gray-200'
                        }`}
                      >
                        <CardExpiryElement 
                          options={cardElementOptions} 
                          onChange={(e) => setCardErrors(p => ({ ...p, expiry: e.error?.message || null }))} 
                        />
                      </div>
                      {cardErrors.expiry && <p className="mt-1.5 text-xs font-medium text-red-600">{cardErrors.expiry}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">CVC</label>
                      <div
                        className={`rounded-sm border bg-white p-3 sm:p-4 transition-colors ${
                          cardErrors.cvc ? 'border-red-400' : 'border-gray-200'
                        }`}
                      >
                        <CardCvcElement 
                          options={cardElementOptions} 
                          onChange={(e) => setCardErrors(p => ({ ...p, cvc: e.error?.message || null }))} 
                        />
                      </div>
                      {cardErrors.cvc && <p className="mt-1.5 text-xs font-medium text-red-600">{cardErrors.cvc}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className={`border transition-colors ${
              paymentMethod === 'cod' ? 'border-teal-600 bg-teal-50/30' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <label className="flex cursor-pointer items-center gap-3 sm:gap-4 p-3 sm:p-4">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cod'}
                onChange={() => {
                  setPaymentMethod('cod');
                  setCardErrors({ number: null, expiry: null, cvc: null });
                }}
                className="accent-teal-600"
              />
              <div>
                <p className="text-sm font-bold text-gray-900">Cash on Delivery</p>
                <p className="text-xs text-gray-500">Pay when your order arrives</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Amount Payable</p>
            <p className="mt-1 text-2xl font-black text-gray-900">Rs. {finalAmount.toLocaleString()}</p>
          </div>
          <Lock className="h-5 w-5 text-gray-300" />
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
          onClick={handlePayment}
          disabled={isProcessing || (paymentMethod === 'card' && !stripe)}
          className="flex flex-1 items-center justify-center gap-2 bg-teal-600 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <CheckCircle className="h-4 w-4 animate-pulse" />
              Processing
            </>
          ) : (
            paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay Rs. ${finalAmount.toLocaleString()}`
          )}
        </button>
      </div>

      <p className="flex items-center justify-center gap-1 text-center text-xs text-gray-400">
        <Lock className="h-3 w-3" /> Your payment information is encrypted and secure
      </p>
    </div>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const { data: paymentConfig, isLoading, isError } = useGetPaymentConfigQuery();
  const stripePromise = useMemo(
    () => (paymentConfig?.publishableKey ? loadStripe(paymentConfig.publishableKey) : null),
    [paymentConfig?.publishableKey]
  );

  if (isLoading) {
    return (
      <div className="border border-gray-100 bg-white p-8 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading secure payment</p>
      </div>
    );
  }

  if (isError || !stripePromise) {
    return (
      <div className="border border-red-100 bg-white p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-black uppercase tracking-tight text-gray-900">Payment Setup Failed</h2>
        <p className="mx-auto mb-6 max-w-sm text-sm text-gray-500">
          Stripe is not configured correctly. Please check the backend Stripe publishable and secret keys.
        </p>
        <button
          type="button"
          onClick={props.onBack}
          className="border border-gray-300 px-8 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 transition-colors hover:border-gray-400"
        >
          Review Order
        </button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default PaymentForm;
