import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLoginMutation } from './authApiSlice';
import { setCredentials } from './authSlice';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password cannot exceed 20 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await login(data).unwrap();
      dispatch(setCredentials(response));
      const redirectTo = response.user.role === 'Admin'
        ? '/admin'
        : location.state?.redirectTo || '/';
      navigate(redirectTo);
    } catch (err) {
      console.error('Failed to login:', err);
      const error = err as { data?: { message?: string; title?: string } };
      const errorMessage = error?.data?.message || error?.data?.title || 'Invalid email or password';
      setServerError(errorMessage);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#eef2ff_34%,#f8fafc_72%)] p-4">
      <div className="w-full max-w-md rounded-lg border border-white/80 bg-white/90 p-6 shadow-2xl shadow-cyan-950/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-950/20">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-lg shadow-cyan-700/25">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading mb-2 text-3xl font-bold text-slate-950">Welcome Back</h1>
          <p className="font-medium text-slate-500">Sign in to your account to continue</p>
        </div>

        {serverError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="w-5 h-5 mt-0.5 shrink-0">⚠️</div>
            <p>{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="ml-1 text-sm font-semibold text-slate-800">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600" />
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                maxLength={25}
                className={`w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 ${
                  errors.email ? 'border-rose-300 ring-4 ring-rose-100' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="ml-1 text-xs font-medium text-rose-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-semibold text-slate-800">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-cyan-700 hover:text-indigo-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                maxLength={20}
                className={`w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-12 text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 ${
                  errors.password ? 'border-rose-300 ring-4 ring-rose-100' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 py-3 font-bold text-white shadow-lg shadow-cyan-700/25 transition-all hover:-translate-y-0.5 hover:shadow-indigo-700/30 disabled:translate-y-0 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-cyan-700 hover:text-indigo-700 hover:underline">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
