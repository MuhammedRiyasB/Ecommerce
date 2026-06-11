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
    requestPhoneOtp: builder.mutation({
      query: (data: { phoneNumber: string; name?: string; email?: string }) => ({
        url: '/Auth/phone-otp/request',
        method: 'POST',
        body: { ...data },
      }),
    }),
    verifyPhoneOtp: builder.mutation({
      query: (data: { phoneNumber: string; code: string; name?: string; email?: string }) => ({
        url: '/Auth/phone-otp/verify',
        method: 'POST',
        body: { ...data },
      }),
    }),
    sendEmailVerification: builder.mutation({
      query: (data: { email: string }) => ({
        url: '/Auth/email-verification/send',
        method: 'POST',
        body: { ...data },
      }),
    }),
    verifyEmail: builder.mutation({
      query: (data: { email: string; token: string }) => ({
        url: '/Auth/email-verification/verify',
        method: 'POST',
        body: { ...data },
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
    updateProfile: builder.mutation({
      query: (data: { name: string; age?: number; email: string }) => ({
        url: '/Auth/profile',
        method: 'PUT',
        body: { ...data },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRequestPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
  useSendEmailVerificationMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
} = authApiSlice;
