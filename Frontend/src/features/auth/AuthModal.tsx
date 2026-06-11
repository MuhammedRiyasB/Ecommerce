import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Check, Loader2, Smartphone, X } from 'lucide-react';
import {
  useRequestPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
} from './authApiSlice';
import { setCredentials } from './authSlice';

type AuthStep = 'MOBILE' | 'OTP';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
};

const isPlaceholderEmail = (email?: string) =>
  !email || email.endsWith('@mobile.urbaniq.local');

const getApiError = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string; title?: string } };
  return apiError.data?.message || apiError.data?.title || fallback;
};

const maskPhoneNumber = (phoneNumber: string) =>
  phoneNumber.length < 4 ? phoneNumber : `${phoneNumber.slice(0, 4)}******`;



const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, redirectTo = '/' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('MOBILE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [requestPhoneOtp, { isLoading: isRequestingOtp }] = useRequestPhoneOtpMutation();
  const [verifyPhoneOtp, { isLoading: isVerifyingOtp }] = useVerifyPhoneOtpMutation();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);



  if (!isOpen) {
    return null;
  }

  const resetToMobile = () => {
    setStep('MOBILE');
    setOtp('');
    setError(null);
    setMessage(null);
  };

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!/^\d{10}$/.test(phoneNumber)) {
      setError('Enter a valid 10 digit mobile number.');
      return;
    }

    try {
      await requestPhoneOtp({ phoneNumber }).unwrap();
      setStep('OTP');
      setMessage('OTP sent to your mobile number.');
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to send OTP right now.'));
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6 digit OTP.');
      return;
    }

    try {
      const response = await verifyPhoneOtp({ phoneNumber, code: otp }).unwrap();
      dispatch(setCredentials(response));

      onClose();
      navigate(redirectTo);
    } catch (verifyError) {
      setError(getApiError(verifyError, 'Invalid or expired OTP.'));
    }
  };



  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-[2px]">
      <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center">
        <div
          className="relative w-full max-w-[750px] overflow-hidden rounded-[18px] bg-white shadow-2xl shadow-black/35"
          role="dialog"
          aria-modal="true"
          aria-label="Log in or sign up"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 grid h-9 w-9 place-items-center text-black transition hover:bg-stone-100"
            aria-label="Close login"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="px-8 pb-7 pt-12 sm:px-16">
            {step === 'MOBILE' && (
              <>
                <div className="text-center">
                  <h1 className="text-2xl font-semibold uppercase tracking-[0.08em] text-[#c9972a]">
                    Log In / Sign Up
                  </h1>
                  <p className="mt-3 text-lg text-black">Join now for a seamless shopping experience</p>
                </div>

                <div className="mx-auto mt-10 max-w-[480px] space-y-3 text-[15px] text-black">
                  {['Easy order tracking', 'Manage return and exchange within 15-days', 'Exclusive deals and additional benefit'].map((item) => (
                    <p key={item} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-black" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>

                <form onSubmit={handleRequestOtp} className="mx-auto mt-9 max-w-[512px] space-y-4">
                  <label className="block text-sm font-semibold uppercase text-stone-400">Mobile Number*</label>
                  <div className="flex h-[60px] items-center border border-black bg-white px-6 text-lg">
                    <span className="mr-3 font-semibold">+91</span>
                    <Smartphone className="mr-3 h-5 w-5 text-stone-400" />
                    <input
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="Enter 10 digit mobile number"
                      className="h-full min-w-0 flex-1 border-0 text-base font-semibold outline-none placeholder:text-stone-400"
                    />
                  </div>
                  <p className="text-sm text-stone-500">
                    By Continuing, I agree to the <span className="underline">Terms & Conditions</span> &{' '}
                    <span className="underline">Privacy Policy</span>
                  </p>
                  {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                  {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
                  <button
                    type="submit"
                    disabled={isRequestingOtp}
                    className="mx-auto flex h-[52px] w-full max-w-[312px] items-center justify-center bg-black font-bold uppercase text-[#d4a72c] shadow-lg transition hover:bg-stone-900 disabled:opacity-60"
                  >
                    {isRequestingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Get OTP'}
                  </button>
                </form>
              </>
            )}

            {step === 'OTP' && (
              <form onSubmit={handleVerifyOtp} className="mx-auto max-w-[512px] pt-8 text-center">
                <h1 className="text-2xl font-semibold uppercase tracking-[0.08em] text-[#c9972a]">Welcome Back!</h1>
                <p className="mt-3 text-lg text-black">
                  Enter the 6 digit OTP sent via SMS to +91 {maskPhoneNumber(phoneNumber)}
                </p>
                <button type="button" onClick={resetToMobile} className="mt-2 text-xs font-bold uppercase underline">
                  Change
                </button>

                <div className="mt-8 text-left">
                  <label className="block text-sm font-semibold uppercase text-stone-400">Mobile Number*</label>
                  <div className="mt-2 h-[58px] border border-black px-6 py-4 text-base font-semibold">+91 {phoneNumber}</div>
                </div>

                <div className="mt-5 text-left">
                  <label className="block text-sm font-semibold uppercase text-stone-400">One Time Password*</label>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="mt-2 h-[58px] w-full border border-black px-6 text-center text-2xl font-semibold tracking-[0.35em] outline-none"
                  />
                </div>

                {error && <p className="mt-3 text-left text-sm font-medium text-red-600">*{error}</p>}
                {message && <p className="mt-3 text-left text-sm font-medium text-emerald-700">{message}</p>}

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="mx-auto mt-7 flex h-[50px] w-full max-w-[312px] items-center justify-center bg-black font-bold uppercase text-[#d4a72c] transition hover:bg-stone-900 disabled:bg-stone-300 disabled:text-white"
                >
                  {isVerifyingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
