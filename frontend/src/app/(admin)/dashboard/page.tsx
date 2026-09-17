'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Mail, MessageSquare, Building2, Loader2, TrendingUp } from 'lucide-react';
import { subscribersApi, companiesApi, enquiriesApi, newslettersApi, unwrapList } from '@/lib/api';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function DashboardPage() {
  const { data: companies, isLoading: cLoad } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.list();
      const d = res.data;
      return unwrapList<any>(d);
    },
  });

  const { data: subs } = useQuery({
    queryKey: ['subscribers-count'],
    queryFn: async () => {
      const res = await subscribersApi.list({ page_size: 1 });
      return res.data.count ?? (Array.isArray(res.data) ? res.data.length : 0);
    },
  });

  const { data: enquiries } = useQuery({
    queryKey: ['enquiries-new'],
    queryFn: async () => {
      const res = await enquiriesApi.list({ status: 'new', page_size: 5 });
      const d = res.data;
      return { count: d.count ?? 0, results: d.results || d || [] };
    },
  });

  const { data: newsletters } = useQuery({
    queryKey: ['newsletters-recent'],
    queryFn: async () => {
      const res = await newslettersApi.list({ page_size: 5 });
      const d = res.data;
      return unwrapList<any>(d);
    },
  });

  const stats = [
    { label: 'Subscribers', value: subs ?? '—', icon: Users, href: '/subscribers', color: 'bg-blue-500' },
    { label: 'Companies', value: companies?.length ?? '—', icon: Building2, href: '/companies', color: 'bg-emerald-500' },
    { label: 'Open Enquiries', value: enquiries?.count ?? '—', icon: MessageSquare, href: '/enquiries', color: 'bg-amber-500' },
    { label: 'Newsletters', value: Array.isArray(newsletters) ? newsletters.length : '—', icon: Mail, href: '/newsletters', color: 'bg-violet-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">REY Corporate Group · Live data from your API</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition block"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {cLoad && s.label === 'Companies' ? (
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  ) : (
                    s.value
                  )}
                </p>
              </div>
              <div className={`${s.color} w-11 h-11 rounded-xl flex items-center justify-center text-white`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Companies</h2>
            <Link href="/companies" className="text-sm text-[#0A2540] hover:underline">View all</Link>
          </div>
          {cLoad ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
          ) : (
            <div className="space-y-2">
              {(companies || []).slice(0, 8).map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-[#0A2540]/10 flex items-center justify-center text-[#0A2540] text-xs font-bold">
                    {(c.short_name || c.name || '?').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{c.name}</div>
                    {c.is_parent && <span className="text-[10px] text-amber-600 uppercase">Parent</span>}
                  </div>
                </div>
              ))}
              {!companies?.length && <p className="text-sm text-slate-400 py-4 text-center">No companies — run seed_rey_companies</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Quick actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { href: '/subscribers', label: 'Import CSV / manage subscribers', icon: Users },
              { href: '/compose', label: 'Compose invitation or thank-you', icon: Mail },
              { href: '/enquiries', label: 'Review enquiries', icon: MessageSquare },
              { href: '/templates', label: 'Edit email templates', icon: TrendingUp },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition"
              >
                <a.icon className="w-4 h-4 text-[#0A2540]" />
                <span className="text-sm text-slate-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
