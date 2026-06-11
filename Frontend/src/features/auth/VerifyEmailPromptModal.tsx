import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, X } from 'lucide-react';
import { selectCurrentUser, selectIsAuthenticated } from './authSlice';
import { useSendEmailVerificationMutation } from './authApiSlice';

const VerifyEmailPromptModal: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sendEmailVerification, { isLoading: isSendingEmail }] = useSendEmailVerificationMutation();

  useEffect(() => {
    // Only show if logged in, email not verified, and we haven't dismissed it this session
    if (isAuthenticated && user && !user.isEmailVerified) {
      const dismissed = sessionStorage.getItem(`verify_prompt_dismissed_${user.userId}`);
      if (!dismissed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 3000); // 3 seconds delay
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user]);

  const handleClose = () => {
    if (user) {
      sessionStorage.setItem(`verify_prompt_dismissed_${user.userId}`, 'true');
    }
    setIsOpen(false);
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
      // Optional: close after a delay
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (sendError) {
      // Inline simple fallback since getApiError might not be in utils yet
      const apiError = sendError as { data?: { message?: string; title?: string } };
      setError(apiError.data?.message || apiError.data?.title || 'Unable to send verification link.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-[2px]">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
        <div
          className="relative w-full max-w-[560px] overflow-hidden rounded-[18px] bg-white px-8 pb-8 pt-12 shadow-2xl shadow-black/35 sm:px-12"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center text-black transition hover:bg-stone-100 rounded-full"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <form onSubmit={handleSendEmailLink} className="mx-auto max-w-[560px]">
            <h1 className="font-heading text-2xl font-semibold text-black">Please Verify Your Email Address</h1>
            <div className="mt-4 border-t border-stone-200 pt-4">
              <p className="text-[15px] leading-6 text-stone-600">
                Verify your email for an uninterrupted shopping experience. Please enter your email and click verify.
              </p>
              <div className="mt-5 flex h-[56px] items-center border border-stone-400 px-4 focus-within:border-black">
                <Mail className="mr-3 h-5 w-5 text-stone-500" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="h-full min-w-0 flex-1 border-0 outline-none placeholder:text-stone-400"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
            {message && <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p>}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="submit"
                disabled={isSendingEmail}
                className="h-[52px] bg-black font-bold uppercase text-[#d4a72c] transition hover:bg-stone-900 disabled:bg-stone-300 disabled:text-white"
              >
                {isSendingEmail ? 'Sending...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-[52px] border border-stone-300 bg-white font-bold uppercase text-stone-700 transition hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPromptModal;
