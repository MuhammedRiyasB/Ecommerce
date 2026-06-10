import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  useForgotPasswordMutation, 
  useVerifyOtpMutation, 
  useResetPasswordMutation 
} from './authApiSlice';
import { toast } from 'react-toastify';

type Step = 'EMAIL' | 'OTP' | 'PASSWORD';

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();
  
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      toast.success('Verification code sent to your email');
      setStep('OTP');
    } catch (err) {
      const error = err as { data?: { message?: string } };
      toast.error(error.data?.message || 'Failed to send verification code');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyOtp({ email, code }).unwrap();
      setStep('PASSWORD');
    } catch (err) {
      const error = err as { data?: { message?: string } };
      toast.error(error.data?.message || 'Invalid or expired code');
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await resetPassword({ email, code, newPassword }).unwrap();
      toast.success('Password reset successful! Please log in.');
      navigate('/?auth=login');
    } catch (err) {
      const error = err as { data?: { message?: string } };
      toast.error(error.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Branding */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Urbaniq<span className="text-primary">.</span>
        </h1>
      </div>

      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* STEP 1: EMAIL ENTRY (Amazon Style) */}
        {step === 'EMAIL' && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Password assistance</h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter the email address associated with your Urbaniq account.
              </p>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-gray-900"
                placeholder="name@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {isSendingOtp ? 'Sending...' : 'Continue'}
            </button>

            <div className="text-center text-sm">
              <Link to="/?auth=login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: OTP ENTRY (Amazon Style) */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enter verification code</h2>
              <p className="mt-2 text-sm text-gray-600">
                For your security, we have sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>.
              </p>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 text-center">
                6-digit code
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="block w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-primary focus:border-primary text-gray-900"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {isVerifyingOtp ? 'Verifying...' : 'Submit code'}
            </button>

            <div className="flex flex-col items-center space-y-4 text-sm">
              <button 
                type="button"
                onClick={handleRequestOtp}
                className="text-primary font-medium hover:underline"
              >
                Resend code
              </button>
              <button 
                type="button"
                onClick={() => setStep('EMAIL')}
                className="text-gray-500 hover:text-gray-700"
              >
                Change email address
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 'PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create new password</h2>
              <p className="mt-2 text-sm text-gray-600">
                We'll ask for this password whenever you sign in.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">New password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-gray-900"
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {isResetting ? 'Saving...' : 'Save changes and sign in'}
            </button>
          </form>
        )}

      </div>

      {/* Amazon Style Footer Links */}
      <div className="mt-8 flex space-x-6 text-xs text-gray-500">
        <a href="#" className="hover:text-primary hover:underline">Conditions of Use</a>
        <a href="#" className="hover:text-primary hover:underline">Privacy Notice</a>
        <a href="#" className="hover:text-primary hover:underline">Help</a>
      </div>
      <p className="mt-4 text-xs text-gray-400">
        © 1996-2026, Urbaniq.com, Inc. or its affiliates
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
