import { apiSlice } from '@/app/apiSlice';

// === Payment DTOs ===

export interface PaymentIntentResponse {
  statusCode: number;
  message: string;
  data: {
    clientSecret: string;
    paymentIntentId: string;
  };
}

export interface PaymentVerifyResponse {
  statusCode: number;
  message: string;
  data: {
    status: string;
  };
}

// === Payment API (Stripe Integration) ===

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Creates a Stripe PaymentIntent for the given amount */
    createPaymentIntent: builder.mutation<PaymentIntentResponse, number>({
      query: (amount) => ({
        url: '/Payment/create-intent',
        method: 'POST',
        body: amount,
        headers: { 'Content-Type': 'application/json' },
      }),
    }),

    /** Verifies a payment using its PaymentIntent ID */
    verifyPayment: builder.mutation<PaymentVerifyResponse, string>({
      query: (paymentIntentId) => ({
        url: '/Payment/verify',
        method: 'POST',
        body: JSON.stringify(paymentIntentId),
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useVerifyPaymentMutation,
} = paymentApiSlice;
