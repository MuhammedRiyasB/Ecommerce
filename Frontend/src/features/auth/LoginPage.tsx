import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Check, Loader2, Mail, Smartphone, X } from 'lucide-react';
import {
  useLoginMutation,
  useRequestPhoneOtpMutation,
  useSendEmailVerificationMutation,
  useVerifyPhoneOtpMutation,
} from './authApiSlice';
import { setCredentials } from './authSlice';

type AuthStep = 'MOBILE' | 'OTP' | 'EMAIL';

const isPlaceholderEmail = (email?: string) =>
  !email || email.endsWith('@mobile.urbaniq.local');

const getApiError = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string; title?: string } };
  return apiError.data?.message || apiError.data?.title || fallback;
};

const maskPhoneNumber = (phoneNumber: string) =>
  phoneNumber.length < 4 ? phoneNumber : `${phoneNumber.slice(0, 4)}******`;

const brandNames = [
  'URBANIQ',
  'ALLEN SOLLY',
  'AMERICAN EAGLE',
  'LOUIS PHILIPPE',
  'PETER ENGLAND',
  'VAN HEUSEN',
];

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<AuthStep>('MOBILE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [requestPhoneOtp, { isLoading: isRequestingOtp }] = useRequestPhoneOtpMutation();
  const [verifyPhoneOtp, { isLoading: isVerifyingOtp }] = useVerifyPhoneOtpMutation();
  const [sendEmailVerification, { isLoading: isSendingEmail }] = useSendEmailVerificationMutation();
  const [login, { isLoading: isAdminLoading }] = useLoginMutation();

  const redirectTo = location.state?.redirectTo || '/';

  useEffect(() => {
    if (step !== 'EMAIL' || email || typeof navigator === 'undefined') {
      return;
    }

    const credentials = (navigator as Navigator & {
      credentials?: {
        get?: (options: Record<string, unknown>) => Promise<{ id?: string } | null>;
      };
    }).credentials;

    void credentials?.get?.({ password: true, mediation: 'optional' })
      .then((credential) => {
        if (credential?.id?.includes('@')) {
          setEmail(credential.id);
        }
      })
      .catch(() => {
        // Browser credential access is optional; normal email autofill remains available.
      });
  }, [email, step]);

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

      if (!response.user.isEmailVerified) {
        setEmail(isPlaceholderEmail(response.user.email) ? '' : response.user.email);
        setStep('EMAIL');
        return;
      }

      navigate(redirectTo);
    } catch (verifyError) {
      setError(getApiError(verifyError, 'Invalid or expired OTP.'));
    }
  };

  const handleSendEmailLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    try {
      await sendEmailVerification({ email }).unwrap();
      setMessage('Verification link sent. Open the link from your email to verify it.');
    } catch (sendError) {
      setError(getApiError(sendError, 'Unable to send verification link.'));
    }
  };

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await login({ email: adminEmail, password: adminPassword }).unwrap();
      dispatch(setCredentials(response));
      navigate(response.user.role === 'Admin' ? '/admin' : redirectTo);
    } catch (loginError) {
      setError(getApiError(loginError, 'Invalid email or password'));
    }
  };

  return (
    <div className="min-h-[82vh] bg-[linear-gradient(135deg,#181511_0%,#3b3328_44%,#f3f0e9_44%,#f3f0e9_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[72vh] max-w-6xl items-center justify-center">
        <div className="relative w-full max-w-[750px] overflow-hidden rounded-[18px] bg-white shadow-2xl shadow-black/30">
          <button
            type="button"
            onClick={() => navigate('/')}
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
                  {['Easy order tracking', 'Manage returns and exchanges within 15 days', 'Exclusive deals and additional benefits'].map((item) => (
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
                    By continuing, I agree to the <span className="underline">Terms & Conditions</span> and{' '}
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
                <button
                  type="button"
                  onClick={() => {
                    setStep('MOBILE');
                    setOtp('');
                    setError(null);
                    setMessage(null);
                  }}
                  className="mt-2 text-xs font-bold uppercase underline"
                >
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

            {step === 'EMAIL' && (
              <form onSubmit={handleSendEmailLink} className="mx-auto max-w-[560px] pt-2">
                <h1 className="font-heading text-2xl font-semibold text-black">Please Verify Your Email Address</h1>
                <div className="mt-6 border-t border-stone-200 pt-6">
                  <p className="text-lg leading-6 text-black">
                    Verify your email for an uninterrupted shopping experience. Please click the authentication link
                    in your inbox to proceed.
                  </p>
                  <p className="mt-5 text-sm text-stone-600">
                    Your browser can suggest saved email addresses in the field below.
                  </p>
                  <div className="mt-5 flex h-[56px] items-center border border-stone-400 px-4">
                    <Mail className="mr-3 h-5 w-5 text-stone-500" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      className="h-full min-w-0 flex-1 border-0 outline-none"
                    />
                  </div>
                </div>

                {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
                {message && <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p>}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="h-[56px] border border-stone-500 bg-white font-bold transition hover:border-black"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(redirectTo)}
                    className="h-[56px] bg-black font-bold text-[#d4a72c] transition hover:bg-stone-900"
                  >
                    Continue Shopping
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="border-t border-stone-200 bg-stone-50 px-8 py-7 sm:px-16">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-center text-xs font-bold tracking-[0.18em] text-black sm:grid-cols-3">
              {brandNames.map((brand) => (
                <span key={brand}>{brand}</span>
              ))}
            </div>

            <div className="mt-7 text-center text-sm text-stone-600">
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin((value) => !value);
                  setError(null);
                  setMessage(null);
                }}
                className="font-semibold text-black underline"
              >
                Admin email login
              </button>
              <span className="mx-2">|</span>
              <Link to="/forgot-password" className="font-semibold text-black underline">
                Forgot password
              </Link>
            </div>

            {showAdminLogin && (
              <form onSubmit={handleAdminLogin} className="mx-auto mt-5 grid max-w-[560px] gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="Admin email"
                  className="h-11 border border-stone-300 px-3 outline-none focus:border-black"
                />
                <input
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  className="h-11 border border-stone-300 px-3 outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={isAdminLoading}
                  className="h-11 bg-black px-6 text-sm font-bold text-[#d4a72c] disabled:opacity-60"
                >
                  {isAdminLoading ? 'Signing in' : 'Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
