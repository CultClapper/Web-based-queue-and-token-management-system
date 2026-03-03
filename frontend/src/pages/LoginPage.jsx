import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await client.post('/auth/login', { email, password });
      localStorage.setItem('servsync_token', data.token);
      localStorage.setItem('servsync_role', data.user.role);
      localStorage.setItem('servsync_user', JSON.stringify(data.user));
      if (rememberMe) {
        localStorage.setItem('servsync_email', email);
      }
      navigate(`/${data.user.role}-dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 text-slate-50">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-[0_40px_120px_rgba(15,23,42,0.9)]">
        <div className="grid gap-0 md:grid-cols-2">
          {/* Left: login form (mirrors register) */}
          <div className="flex flex-col justify-between px-6 py-8 sm:px-8 lg:px-10 lg:py-10 bg-slate-950/70 backdrop-blur-xl">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Account access
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-50">
                Log in to ServSync
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Secure access for customers, operators, and admins — pick up where
                your last session left off.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <span className="mt-0.5 text-lg">!</span>
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-50 shadow-inner outline-none transition focus:border-indigo-400 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/60"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-50 shadow-inner outline-none transition focus:border-indigo-400 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/60"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-[13px] text-slate-300">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>Remember this device</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(79,70,229,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(79,70,229,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Log in
                </button>
              </form>

              <p className="text-xs text-slate-400">
                New to ServSync?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          {/* Right: illustration panel (same style as register) */}
          <div className="relative hidden md:block bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-400">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.18)_0,transparent_50%),radial-gradient(circle_at_80%_0,rgba(129,140,248,0.35)_0,transparent_55%),radial-gradient(circle_at_0_80%,rgba(248,250,252,0.2)_0,transparent_55%)] opacity-90" />
            <div className="relative flex h-full flex-col justify-between p-8 lg:p-10 text-slate-900">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Seamless sign‑in
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  ServSync Cloud
                </span>
              </div>

              <div className="mt-10 space-y-5">
                <h2 className="text-2xl lg:text-3xl font-semibold leading-tight text-slate-900">
                  Pick up every <br />
                  service journey where you left it.
                </h2>
                <p className="text-sm text-slate-700/90">
                  Your dashboards, queues, and performance insights are securely
                  available as soon as you log back in.
                </p>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white/75 p-3 text-xs text-slate-800 backdrop-blur">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <span>🔒</span>
                  </div>
                  <div>
                    <p className="font-semibold">Enterprise‑grade security</p>
                    <p className="text-[11px] text-slate-500">
                      Role‑based access for admins, operators, and customers.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-700">
                  SSO and secure password policies keep every login protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
