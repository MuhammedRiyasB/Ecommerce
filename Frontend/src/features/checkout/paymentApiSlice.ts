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

interface CreatePaymentIntentRequest {
  amount: number;
}

interface VerifyPaymentRequest {
  paymentIntentId: string;
}

export interface PaymentVerifyResponse {
  statusCode: number;
  message: string;
  data: {
    status: string;
    isSuccessful: boolean;
  };
}

export interface PaymentConfigResponse {
  publishableKey: string;
}

// === Payment API (Stripe Integration) ===

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Gets Stripe browser configuration from the backend to avoid frontend/backend key mismatch */
    getPaymentConfig: builder.query<PaymentConfigResponse, void>({
      query: () => '/Payment/config',
    }),

    /** Creates a Stripe PaymentIntent for the given amount */
    createPaymentIntent: builder.mutation<PaymentIntentResponse, CreatePaymentIntentRequest>({
      query: (body) => ({
        url: '/Payment/create-intent',
        method: 'POST',
        body,
      }),
    }),

    /** Verifies a payment using its PaymentIntent ID */
    verifyPayment: builder.mutation<PaymentVerifyResponse, VerifyPaymentRequest>({
      query: (body) => ({
        url: '/Payment/verify',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetPaymentConfigQuery,
  useCreatePaymentIntentMutation,
  useVerifyPaymentMutation,
} = paymentApiSlice;
