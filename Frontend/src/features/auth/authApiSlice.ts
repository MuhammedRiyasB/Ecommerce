import { apiSlice } from '@/app/apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/Auth/login',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/Auth/register',
        method: 'POST',
        body: { ...userData },
      }),
    }),
    forgotPassword: builder.mutation({
      query: (data: { email: string }) => ({
        url: '/Auth/forgot-password',
        method: 'POST',
        body: { ...data },
      }),
    }),
    verifyOtp: builder.mutation({
      query: (data: { email: string; code: string }) => ({
        url: '/Auth/verify-otp',
        method: 'POST',
        body: { ...data },
      }),
    }),
    resetPassword: builder.mutation({
      query: (data: { email: string; code: string; newPassword: string }) => ({
        url: '/Auth/reset-password',
        method: 'POST',
        body: { ...data },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} = authApiSlice;

