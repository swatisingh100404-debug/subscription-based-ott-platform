import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { CreditCard, Check, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        setPlans(res.data);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleOpenCheckout = (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleMockCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setPaying(true);

    try {
      await api.post('/plans/subscribe', {
        planId: selectedPlan._id,
        cardNumber,
        expiry,
        cvv,
      });

      setSuccess(true);
      await refreshUser();
      
      // Delay navigation
      setTimeout(() => {
        setShowCheckout(false);
        setSuccess(false);
        navigate('/profile');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed. Please verify card details.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cosmic-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-coral"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-dark pb-20 px-4 sm:px-6 lg:px-8 pt-8 bg-radial-glow">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-white sm:text-5xl">Select Your Plan</h1>
          <p className="mt-3 text-sm text-silver uppercase tracking-widest">
            Unlock ad-free streaming, 4K quality, and interactive watch parties
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isUserCurrent = user?.subscription?.plan?._id === plan._id && user?.subscription?.status === 'active';
            
            return (
              <div
                key={plan._id}
                className={`flex flex-col rounded-2xl glass-panel p-8 relative overflow-hidden transition-all duration-300 ${
                  isUserCurrent
                    ? 'border-coral shadow-xl shadow-coral/10 scale-105'
                    : 'hover:scale-102 hover:shadow-2xl'
                }`}
              >
                {isUserCurrent && (
                  <div className="absolute -right-12 -top-1 px-12 py-2 bg-coral text-white text-[9px] font-extrabold rotate-45 uppercase tracking-wider">
                    Current Plan
                  </div>
                )}
                
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">₹{plan.price}</span>
                  <span className="ml-1.5 text-xs text-silver">
                    /{plan.durationMonths > 1 ? `${plan.durationMonths} months` : 'month'}
                  </span>
                </div>

                <ul className="mt-6 space-y-4 flex-1 border-t border-white/5 pt-6 text-xs text-silver">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-coral shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleOpenCheckout(plan)}
                  disabled={isUserCurrent}
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-xs font-bold text-white transition-all ${
                    isUserCurrent
                      ? 'bg-green-600/20 text-green-400 border border-green-500/20 cursor-default'
                      : 'bg-coral hover:bg-coral-hover shadow-lg shadow-coral/15'
                  }`}
                >
                  {isUserCurrent ? 'Current Plan Active' : 'Subscribe Now'}
                </button>
              </div>
            );
          })}
        </div>

        {/* MOCK CREDIT CARD CHECKOUT MODAL */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="relative w-full max-w-md rounded-2xl p-6 glass-panel border border-white/10 shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-coral" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Secured Mock Checkout</h3>
                </div>
                {!success && (
                  <button onClick={() => setShowCheckout(false)} className="text-silver hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {success ? (
                // Checkout Success View
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/30 animate-bounce">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">Payment Successful!</h4>
                  <p className="text-xs text-silver">
                    Your account has been upgraded to <strong className="text-coral">{selectedPlan.name}</strong>.<br />
                    Redirecting to your profile dashboard...
                  </p>
                </div>
              ) : (
                // Checkout Form
                <form onSubmit={handleMockCheckout} className="space-y-4">
                  <div className="bg-cosmic-light/40 rounded-xl p-3 border border-white/5 flex justify-between items-center text-xs">
                    <span className="text-silver">Subscribing to: <strong>{selectedPlan.name}</strong></span>
                    <span className="font-extrabold text-white text-sm">₹{selectedPlan.price}</span>
                  </div>

                  {error && (
                    <div className="flex items-center space-x-2 rounded-lg bg-red-950/20 border border-red-500/20 p-2.5 text-xs text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg py-2 px-3 text-xs glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength="19"
                      value={cardNumber}
                      onChange={(e) => {
                        // Formatting input as 1111 2222 3333 4444
                        const val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                      placeholder="1234 5678 1234 5678"
                      className="w-full rounded-lg py-2 px-3 text-xs glass-input font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-1">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength="5"
                        value={expiry}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\s?/g, '').replace(/(\d{2})/g, '$1/').replace(/\/$/, '');
                          setExpiry(val);
                        }}
                        placeholder="MM/YY"
                        className="w-full rounded-lg py-2 px-3 text-xs glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-1">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength="3"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        className="w-full rounded-lg py-2 px-3 text-xs glass-input font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={paying}
                    className="w-full rounded-lg bg-coral py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-coral-hover disabled:opacity-50 mt-2"
                  >
                    {paying ? 'Processing Transaction...' : `Pay ₹${selectedPlan.price}`}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
