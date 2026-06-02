import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRegisterMutation } from './authApiSlice';

const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(20, 'Name cannot exceed 20 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password cannot exceed 20 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      await registerUser({
        name: data.fullName,
        email: data.email,
        password: data.password,
      }).unwrap();
      
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Failed to register:', err);
      // Try to parse the exact error structure sent by the backend Global Exception Handler
      const error = err as { data?: { message?: string; title?: string } };
      const errorMessage = error?.data?.message || error?.data?.title || 'Registration failed. Please check your information.';
      setServerError(errorMessage);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[radial-gradient(circle_at_top_left,#dcfce7_0,#e0f2fe_34%,#f8fafc_72%)] p-4">
      <div className="w-full max-w-md rounded-lg border border-white/80 bg-white/90 p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-950/20">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-cyan-600 to-blue-700 shadow-lg shadow-emerald-700/25">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading mb-2 text-3xl font-bold text-slate-950">Create Account</h1>
          <p className="font-medium text-slate-500">Join our community and start shopping</p>
        </div>

        {serverError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="w-5 h-5 mt-0.5 shrink-0">⚠️</div>
            <p>{serverError}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <div className="w-5 h-5 mt-0.5 shrink-0 text-xl leading-none">✅</div>
            <p>{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-800">Full Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
              <input
                {...register('fullName')}
                type="text"
                placeholder="John Doe"
                maxLength={20}
                className={`w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${
                  errors.fullName ? 'border-rose-300 ring-4 ring-rose-100' : ''
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="ml-1 text-xs font-medium text-rose-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-800">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                maxLength={25}
                className={`w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${
                  errors.email ? 'border-rose-300 ring-4 ring-rose-100' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="ml-1 text-xs font-medium text-rose-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-800">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                maxLength={20}
                className={`w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-12 text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${
                  errors.password ? 'border-rose-300 ring-4 ring-rose-100' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="ml-1 text-xs font-medium text-rose-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-800">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                maxLength={20}
                className={`w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${
                  errors.confirmPassword ? 'border-rose-300 ring-4 ring-rose-100' : ''
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="ml-1 text-xs font-medium text-rose-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 via-cyan-600 to-blue-700 py-3 font-bold text-white shadow-lg shadow-emerald-700/25 transition-all hover:-translate-y-0.5 hover:shadow-blue-700/30 disabled:translate-y-0 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm font-medium text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-700 hover:text-blue-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
