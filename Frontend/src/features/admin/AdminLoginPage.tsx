import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader2, LockKeyhole } from 'lucide-react';
import { useLoginMutation } from '../auth/authApiSlice';
import { setCredentials } from '../auth/authSlice';

const getApiError = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string; title?: string } };
  return apiError.data?.message || apiError.data?.title || fallback;
};

const AdminLoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await login({ email, password }).unwrap();

      if (response.user.role !== 'Admin') {
        setError('This login is only for admin users.');
        return;
      }

      dispatch(setCredentials(response));
      navigate('/admin', { replace: true });
    } catch (loginError) {
      setError(getApiError(loginError, 'Invalid admin credentials.'));
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#111827] px-4 text-[#f8f5ee]">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-[#303a4d] bg-[#172033] p-8 shadow-2xl shadow-black/30">
        <div className="mb-8">
          <div className="mb-5 grid h-12 w-12 place-items-center bg-[#d7b46a] text-[#111827]">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d7b46a]">Urbaniq</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.1em]">Admin Console</h1>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9ba4b5]">Admin Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="mt-2 h-12 w-full border border-[#384257] bg-[#111827] px-4 text-sm text-white outline-none focus:border-[#d7b46a]"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9ba4b5]">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-2 h-12 w-full border border-[#384257] bg-[#111827] px-4 text-sm text-white outline-none focus:border-[#d7b46a]"
              required
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm font-semibold text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-[#d7b46a] text-xs font-black uppercase tracking-[0.22em] text-[#111827] disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
