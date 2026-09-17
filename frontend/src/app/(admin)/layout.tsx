'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-[#0A2540] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="pl-64">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">REY Corporate Group · Australia</div>
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
            onChange={(e) => {
              if (e.target.value) localStorage.setItem('current_company_id', e.target.value);
            }}
          >
            <option value="">All Companies</option>
            <option value="rey">REY Corporate Group</option>
            <option value="rey-properties">Rey Properties</option>
            <option value="sandstone">Sandstone Constructions</option>
            <option value="alpha">Alpha Investment</option>
            <option value="abs">ABS</option>
            <option value="rigid">Rigid Landscaping</option>
            <option value="stonegrove">Stonegrove Homes</option>
            <option value="rey-homes">Rey Homes</option>
            <option value="kaam-kotha">Kaam Kotha</option>
          </select>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
