import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { loginWithGoogle, loginWithEmail } from '../lib/firebase';

interface SignInPageProps {
  onSuccess: (user: any, rememberMe: boolean) => void;
  onSwitchToSignUp: () => void;
  onBack: () => void;
  onAdminLoginClick: () => void;
}

export function SignInPage({ onSuccess, onSwitchToSignUp, onBack, onAdminLoginClick }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fbUser = await loginWithEmail(email, password);
      onSuccess({
        id: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || 'User',
        role: 'user'
      }, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      onSuccess({
        id: user.uid,
        email: user.email,
        name: user.displayName,
        role: 'user'
      }, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100"
      >
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Back</span>
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-brand-600 p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">ScholarMind AI</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-slate-500 mb-8">Sign in to continue your scholarship journey.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-slate-200 rounded-lg bg-slate-50 peer-checked:bg-brand-600 peer-checked:border-brand-600 transition-all group-hover:border-brand-200" />
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
            </label>
            <button type="button" className="text-sm font-medium text-brand-600 hover:underline">Forgot password?</button>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-500 text-xs font-bold p-4 rounded-2xl border border-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="mt-8 w-full bg-white text-slate-900 border border-slate-200 font-bold py-5 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
        >
          {googleLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignUp} className="text-brand-600 font-bold hover:underline">
              Sign Up for Free
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
