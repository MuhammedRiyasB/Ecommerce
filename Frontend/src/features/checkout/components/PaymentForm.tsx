import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, XCircle } from 'lucide-react';
import { useCreatePaymentIntentMutation, useVerifyPaymentMutation } from '../paymentApiSlice';
import { usePlaceOrderMutation } from '@/features/orders/orderApiSlice';
import type { CartResponse } from '@/features/cart/cartApiSlice';
import type { Address } from '../addressApiSlice';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';
import {
  getCardValidationMessage,
  initialCardFieldState,
  type CardFieldState,
} from '../paymentCardValidation';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_TYooMQauvdEDq54NiTphI7jx'
);

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
  const [cardField, setCardField] = useState<CardFieldState>(initialCardFieldState);
  const [cardInlineError, setCardInlineError] = useState<string | null>(null);

  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    const next: CardFieldState = {
      empty: event.empty,
      complete: event.complete,
      errorCode: event.error?.code ?? null,
      errorMessage: event.error?.message ?? null,
    };
    setCardField(next);
    setCardInlineError(getCardValidationMessage(next));
  };

  const validateCardFields = (): boolean => {
    const message = getCardValidationMessage(cardField);
    if (message) {
      setCardInlineError(message);
      toast.error(message);
      return false;
    }
    setCardInlineError(null);
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
        const cardElement = activeElements!.getElement(CardElement);
        if (!cardElement) throw new Error('Card element not found');

        const intentResult = await createPaymentIntent(finalAmount).unwrap();
        const clientSecret =
          typeof intentResult.data === 'string'
            ? intentResult.data
            : intentResult.data?.clientSecret;
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
          setCardInlineError(message);
          toast.error(message);
          setIsProcessing(false);
          return;
        }

        await verifyPayment(paymentIntent.id).unwrap();

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
      const message = error?.data?.message || 'Payment failed. Please try again.';
      setFailureMessage(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (failureMessage) {
    return (
      <div className="border border-red-100 bg-white p-8 text-center sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
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
      </div>
    );
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '14px',
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
      <div className="border border-gray-100 bg-white p-6">
        <h3 className="mb-5 text-xs font-black uppercase tracking-widest text-gray-900">Choose Payment Method</h3>
        <div className="space-y-3">
          <label
            className={`flex cursor-pointer items-start gap-4 border p-4 transition-colors ${
              paymentMethod === 'card' ? 'border-teal-600 bg-teal-50/30' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'card'}
              onChange={() => {
                setPaymentMethod('card');
                setCardInlineError(null);
              }}
              className="mt-1 accent-teal-600"
            />
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <p className="text-sm font-bold text-gray-900">Credit / Debit Card</p>
              </div>
              <p className="mb-4 text-xs text-gray-500">Secure payment via Stripe</p>

              {paymentMethod === 'card' && (
                <div className="mt-4">
                  <div
                    className={`rounded-sm border bg-white p-4 transition-colors ${
                      cardInlineError ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <CardElement options={cardElementOptions} onChange={handleCardChange} />
                  </div>
                  {cardInlineError && (
                    <p className="mt-2 text-xs font-medium text-red-600">{cardInlineError}</p>
                  )}
                </div>
              )}
            </div>
          </label>

          <label
            className={`flex cursor-pointer items-center gap-4 border p-4 transition-colors ${
              paymentMethod === 'cod' ? 'border-teal-600 bg-teal-50/30' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'cod'}
              onChange={() => {
                setPaymentMethod('cod');
                setCardField(initialCardFieldState);
                setCardInlineError(null);
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
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
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
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default PaymentForm;
