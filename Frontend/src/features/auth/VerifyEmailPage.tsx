import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Loader2, X } from 'lucide-react';
import { useVerifyEmailMutation } from './authApiSlice';

const getApiError = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string; title?: string } };
  return apiError.data?.message || apiError.data?.title || fallback;
};

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verifyEmail] = useVerifyEmailMutation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const email = searchParams.get('email') ?? '';
    const token = searchParams.get('token') ?? '';

    if (!email || !token) {
      setStatus('error');
      setMessage('This email verification link is missing required information.');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail({ email, token }).unwrap();
        setStatus('success');
        setMessage('Your email address has been verified successfully.');
      } catch (error) {
        setStatus('error');
        setMessage(getApiError(error, 'This email verification link is invalid or expired.'));
      }
    };

    void verify();
  }, [searchParams, verifyEmail]);

  return (
    <div className="min-h-[82vh] bg-stone-100 px-4 py-12">
      <div className="mx-auto max-w-[560px] border border-stone-200 bg-white p-8 shadow-xl">
        <div className="flex items-start gap-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center bg-black text-[#d4a72c]">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <Check className="h-6 w-6" />}
            {status === 'error' && <X className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-black">Email Verification</h1>
            <p className="mt-3 text-stone-600">{message}</p>
            <Link
              to="/"
              className="mt-6 inline-flex h-11 items-center bg-black px-6 text-sm font-bold uppercase text-[#d4a72c]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
