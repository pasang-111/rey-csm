'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';
import { REY_CORPORATE_LOGO, COMPANY_LOGOS } from '@/lib/emailTemplates';

const SUB_COMPANIES = [
  { name: 'Rey Homes', logo: COMPANY_LOGOS['rey-homes'] },
  { name: 'Rey Properties', logo: COMPANY_LOGOS['rey-properties'] },
  { name: 'Sandstone Constructions', logo: COMPANY_LOGOS['sandstone-constructions'] },
  { name: 'Stonegrove Homes', logo: COMPANY_LOGOS['stonegrove-homes'] },
  { name: 'Rigid Landscaping', logo: COMPANY_LOGOS['rigid-landscaping'] },
  { name: 'After Build Solutions', logo: COMPANY_LOGOS['after-build-solutions'] },
  { name: 'Alpha Investment', logo: COMPANY_LOGOS['alpha-investment'] },
];

// Duplicate for seamless infinite marquee
const MARQUEE_ITEMS = [...SUB_COMPANIES, ...SUB_COMPANIES];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Invalid credentials. Use the Django username from createsuperuser.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070f1a] relative overflow-hidden">
      {/* Ambient luxury glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201,162,39,0.25), transparent), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(10,37,64,0.8), transparent)',
        }}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Brand mark */}
        <div className="text-center mb-8 max-w-lg">
          <div className="inline-flex items-center justify-center mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={REY_CORPORATE_LOGO}
              alt="REY Corporate Group"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_8px_32px_rgba(201,162,39,0.35)]"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                const fallback = el.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div
              className="hidden w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#C9A227] to-[#E8D48B] items-center justify-center font-bold text-2xl text-[#0A2540] shadow-lg"
              aria-hidden
            >
              R
            </div>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-semibold tracking-[0.08em] text-white uppercase"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            REY Corporate Group
          </h1>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#C9A227]/80" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#C9A227]">
              Australia · Excellence
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#C9A227]/80" />
          </div>
          <p className="mt-3 text-sm text-white/50">
            Marketing &amp; communications platform
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/40 p-8 space-y-5 border border-white/10"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540]/30 text-sm"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540]/30 text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0A2540] text-white font-medium hover:bg-[#0A2540]/90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
          <p className="text-xs text-center text-slate-400">
            Sign in with your <span className="font-mono text-slate-500">username</span> (from createsuperuser)
          </p>
        </form>
      </div>

      {/* Subsidiary marquee */}
      <div className="relative border-t border-white/5 bg-black/30 backdrop-blur-sm py-5 overflow-hidden">
        <div className="text-center mb-3">
          <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-[#C9A227]/90">
            Our companies
          </span>
        </div>
        <div className="relative">
          <div className="flex gap-10 w-max animate-rey-marquee">
            {MARQUEE_ITEMS.map((co, i) => (
              <div
                key={`${co.name}-${i}`}
                className="flex items-center gap-3 shrink-0 opacity-80 hover:opacity-100 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={co.logo}
                  alt={co.name}
                  className="h-7 w-auto object-contain brightness-0 invert opacity-90"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-xs text-white/70 whitespace-nowrap font-medium tracking-wide">
                  {co.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#070f1a] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#070f1a] to-transparent" />
      </div>

    </div>
  );
}
