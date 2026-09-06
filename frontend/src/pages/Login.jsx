import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardRouteForRole } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, ArrowRight, Bot, Building2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('company');
  const [screen, setScreen] = useState('choice');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (code) {
      const processGoogleCode = async () => {
        try {
          setIsSubmitting(true);
          const authData = await googleLogin({ code });
          window.history.replaceState({}, document.title, window.location.pathname);
          const targetRoute = from || getDashboardRouteForRole(authData?.user?.role);
          navigate(targetRoute, { replace: true });
        } catch (err) {
          setError(
            err.response?.data?.message ||
              'Google authentication failed. Please try signing in with email and password.'
          );
        } finally {
          setIsSubmitting(false);
        }
      };

      processGoogleCode();
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const authData = await login(email, password, accountType);
      const targetRoute = from || getDashboardRouteForRole(authData?.user?.role);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const response = await authAPI.getGoogleUrl();
      if (response.data?.success && response.data?.data?.url) {
        window.location.href = response.data.data.url;
      } else {
        throw new Error('Could not obtain Google authentication URL');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Google OAuth is not configured yet on this environment. Please log in with email/password.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'admin',
      title: 'Login as Admin',
      description: 'For the DealPilot platform administrator.',
      icon: ShieldCheck,
      accent: 'amber',
    },
    {
      value: 'company',
      title: 'Login as Company / User',
      description: 'For companies and their team members using DealPilot.',
      icon: Building2,
      accent: 'indigo',
    },
  ];
  const selectedRole = roleOptions.find((option) => option.value === accountType);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_32%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-300 shadow-lg shadow-indigo-950/40">
            <Bot className="h-7 w-7" />
          </div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">DealPilot</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Welcome to DealPilot</h1>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">AI-Powered Sales &amp; Negotiation Platform</p>
        </div>

        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur sm:p-8">
          {screen === 'choice' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {roleOptions.map(({ value, title, description, icon: Icon, accent }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setAccountType(value); setError(''); setScreen('form'); }}
                  className={`group rounded-2xl border border-slate-700 bg-slate-950/70 p-6 text-left transition duration-200 hover:-translate-y-1 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${accent === 'amber' ? 'hover:border-amber-400/60' : 'hover:border-indigo-400/60'}`}
                >
                  <span className={`mb-8 inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent === 'amber' ? 'bg-amber-400/15 text-amber-300' : 'bg-indigo-400/15 text-indigo-300'}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="block text-lg font-semibold text-white">{title}</span>
                  <span className="mt-2 block min-h-10 text-sm leading-6 text-slate-400">{description}</span>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition group-hover:gap-3">Continue <ArrowRight className="h-4 w-4" /></span>
                </button>
              ))}

              <div className="mt-8 border-t border-slate-800 pt-5 text-center">
                <Link to="/register" className="inline-flex w-full items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/20">
                  Register a new account
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <button type="button" onClick={() => { setScreen('choice'); setError(''); }} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to login options
              </button>
              <div className="mb-6 flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accountType === 'admin' ? 'bg-amber-400/15 text-amber-300' : 'bg-indigo-400/15 text-indigo-300'}`}>
                  {selectedRole && <selectedRole.icon className="h-5 w-5" />}
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedRole?.title}</h2>
                  <p className="text-sm text-slate-400">Enter your credentials to continue.</p>
                </div>
              </div>

              {error && <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" placeholder="name@company.com" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Password</label>
                    <Link to="/forgot-password" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-11 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 text-slate-500 transition hover:text-slate-200">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? 'Logging in...' : 'Login'}
                  {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-800" /> or <span className="h-px flex-1 bg-slate-800" /></div>
              <button type="button" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleLoading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-50">
                {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
