import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Heart, HelpCircle, LogOut, Package, Ticket, User, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '@/features/auth/authSlice';

const helpAnswers: Record<string, string> = {
  order: 'You can track, cancel, or request a return from My Orders. Cancellation is available before shipping. Returns are available after delivery.',
  payment: 'Card payments are processed through Stripe. Cash on delivery creates the order immediately and payment is collected at delivery.',
  refund: 'Refunds start after a cancellation or approved return. Card refunds go back to the original payment method; COD refunds are handled by support.',
  delivery: 'Checkout allows only addresses matching the pincode selected on the product page.',
};

const AccountPage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');

  const answer = useMemo(() => {
    const normalized = question.toLowerCase();
    const match = Object.entries(helpAnswers).find(([keyword]) => normalized.includes(keyword));
    return match?.[1] ?? 'Ask about orders, payment, refunds, or delivery and I will guide you to the right next step.';
  }, [question]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const referralCode = user?.name ? `URB-${user.name.replace(/\s+/g, '').slice(0, 6).toUpperCase()}10` : 'URB-FRIEND10';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 border border-gray-100 bg-white p-6">
          <p className="text-xs font-black uppercase tracking-widest text-teal-600">My Account</p>
          <h1 className="mt-2 text-2xl font-black text-gray-900">{user?.name || 'Customer'}</h1>
          {user?.phoneNumber && <p className="mt-1 text-sm text-gray-500">{user.phoneNumber}</p>}
          {user?.isEmailVerified && <p className="mt-1 text-sm text-gray-500">{user.email}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/profile" className="border border-gray-100 bg-white p-5 hover:border-teal-200">
            <User className="mb-4 h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">My Profile</h2>
            <p className="mt-2 text-sm text-gray-500">Profile details are linked to your login account.</p>
          </Link>
          <Link to="/orders" className="border border-gray-100 bg-white p-5 hover:border-teal-200">
            <Package className="mb-4 h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Orders</h2>
            <p className="mt-2 text-sm text-gray-500">Track, cancel, return, and view order details.</p>
          </Link>
          <Link to="/wishlist" className="border border-gray-100 bg-white p-5 hover:border-teal-200">
            <Heart className="mb-4 h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Wishlist</h2>
            <p className="mt-2 text-sm text-gray-500">Saved products for later shopping.</p>
          </Link>
          <div className="border border-gray-100 bg-white p-5">
            <Ticket className="mb-4 h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Coupons</h2>
            <p className="mt-2 text-sm text-gray-500">Eligible coupons will appear here and at checkout.</p>
          </div>
          <div className="border border-gray-100 bg-white p-5">
            <Users className="mb-4 h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Referrals</h2>
            <p className="mt-2 text-sm text-gray-500">Share code <strong>{referralCode}</strong>. Friend gets 10% off; you get a coupon after their first delivered order.</p>
          </div>
          <button onClick={handleLogout} className="border border-gray-100 bg-white p-5 text-left hover:border-red-200">
            <LogOut className="mb-4 h-5 w-5 text-red-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Logout</h2>
            <p className="mt-2 text-sm text-gray-500">Sign out from this device.</p>
          </button>
        </div>

        <section className="mt-6 border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Help Center</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={5}
              className="resize-none border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
              placeholder="Ask about order, payment, refund, or delivery"
            />
            <div className="border border-teal-100 bg-teal-50/40 p-4 text-sm leading-6 text-gray-700">
              <div className="mb-2 flex items-center gap-2 font-black uppercase tracking-widest text-teal-700">
                <Gift className="h-4 w-4" />
                AI Help
              </div>
              {answer}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AccountPage;
