import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, setCredentials } from '../auth/authSlice';
import { useUpdateProfileMutation, useSendEmailVerificationMutation } from '../auth/authApiSlice';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const ProfilePage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState<string | null>(null);

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [sendEmailVerification, { isLoading: isSendingEmail }] = useSendEmailVerificationMutation();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAge(user.age?.toString() || '');
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAge = age ? parseInt(age, 10) : undefined;

    try {
      const response = await updateProfile({
        name,
        age: parsedAge,
        email,
      }).unwrap();

      // updateProfile returns { message, data: user }
      const updatedUser = response.data;
      
      // Update local storage / redux with the new user data
      // We must preserve the existing access token
      const currentToken = localStorage.getItem('ecommerce.auth');
      if (currentToken) {
        const parsedState = JSON.parse(currentToken);
        if (parsedState.token) {
          dispatch(setCredentials({ user: updatedUser, accessToken: parsedState.token }));
        }
      }

      toast.success('Profile updated successfully!');
    } catch (err) {
      // Inline fallback if getApiError isn't robust
      const apiError = err as { data?: { message?: string; title?: string } };
      setError(apiError.data?.message || apiError.data?.title || 'Failed to update profile.');
      toast.error('Failed to update profile');
    }
  };

  const handleSendVerification = async () => {
    try {
      await sendEmailVerification({ email }).unwrap();
      toast.success('Verification link sent to your email.');
    } catch (err) {
      const apiError = err as { data?: { message?: string; title?: string } };
      toast.error(apiError.data?.message || apiError.data?.title || 'Failed to send verification email.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 border border-gray-100 bg-white p-6">
          <p className="text-xs font-black uppercase tracking-widest text-teal-600">My Profile</p>
          <h1 className="mt-2 text-2xl font-black text-gray-900">Personal Details</h1>
        </div>

        <div className="border border-gray-100 bg-white p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold uppercase text-stone-400">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 h-12 w-full border border-gray-300 px-4 focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase text-stone-400">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="150"
                  className="mt-2 h-12 w-full border border-gray-300 px-4 focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-semibold uppercase text-stone-400">Email Address</label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 w-full border border-gray-300 px-4 focus:border-black focus:outline-none"
                />
              </div>
              
              <div className="mt-3 flex items-center gap-2">
                {user.isEmailVerified && user.email === email ? (
                  <span className="flex items-center text-sm font-semibold text-emerald-600">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Verified
                  </span>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-sm font-medium text-amber-600">Not verified</span>
                    {user.email === email && (
                       <button
                         type="button"
                         onClick={handleSendVerification}
                         disabled={isSendingEmail}
                         className="flex items-center gap-1 text-sm font-bold uppercase underline text-black transition hover:text-teal-600 disabled:opacity-50"
                       >
                         <Mail className="h-4 w-4" />
                         {isSendingEmail ? 'Sending...' : 'Verify Now'}
                       </button>
                    )}
                    {user.email !== email && (
                      <span className="text-xs text-stone-500">Save changes to verify new email.</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex h-12 min-w-[160px] items-center justify-center bg-black px-8 font-bold uppercase text-[#d4a72c] transition hover:bg-stone-900 disabled:opacity-70"
              >
                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
