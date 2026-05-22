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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-heading mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join our community and start shopping</p>
        </div>

        {serverError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
            <div className="w-5 h-5 mt-0.5 shrink-0">⚠️</div>
            <p>{serverError}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
            <div className="w-5 h-5 mt-0.5 shrink-0 text-xl leading-none">✅</div>
            <p>{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                {...register('fullName')}
                type="text"
                placeholder="John Doe"
                maxLength={20}
                className={`w-full bg-secondary/50 border-none rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
                  errors.fullName ? 'ring-2 ring-destructive/20' : ''
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-destructive ml-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                maxLength={25}
                className={`w-full bg-secondary/50 border-none rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
                  errors.email ? 'ring-2 ring-destructive/20' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive ml-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                maxLength={20}
                className={`w-full bg-secondary/50 border-none rounded-xl py-3 pl-11 pr-12 focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
                  errors.password ? 'ring-2 ring-destructive/20' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Eye className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive ml-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                maxLength={20}
                className={`w-full bg-secondary/50 border-none rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
                  errors.confirmPassword ? 'ring-2 ring-destructive/20' : ''
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive ml-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
