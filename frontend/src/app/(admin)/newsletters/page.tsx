'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus, Search, Loader2, Mail, Eye, MousePointerClick, AlertCircle, RefreshCw,
} from 'lucide-react';
import { newslettersApi, companiesApi, unwrapList } from '@/lib/api';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    scheduled: 'bg-amber-50 text-amber-700',
    sending: 'bg-blue-50 text-blue-700',
    queued: 'bg-blue-50 text-blue-700',
    sent: 'bg-emerald-50 text-emerald-700',
    partial: 'bg-amber-50 text-amber-700',
    failed: 'bg-rose-50 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

export default function NewslettersPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.list();
      const d = res.data as any;
      return unwrapList<any>(d);
    },
  });

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['newsletters', debounced, companyFilter, statusFilter, kindFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debounced) params.search = debounced;
      if (companyFilter) params.company = companyFilter;
      if (statusFilter) params.status = statusFilter;
      if (kindFilter) params.kind = kindFilter;
      const res = await newslettersApi.list(params);
      const raw = res.data as any;
      return unwrapList<any>(raw);
    },
  });

  const list = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Newsletters & campaigns</h1>
          <p className="text-slate-500 mt-1">Search, filter and open delivery logs</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/newsletters/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium hover:bg-[#0A2540]/90 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New campaign
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#b99a61]"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
        >
          <option value="">All companies</option>
          {companies.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
        >
          <option value="">All statuses</option>
          {['draft', 'scheduled', 'queued', 'sending', 'sent', 'partial', 'failed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
        >
          <option value="">All kinds</option>
          <option value="newsletter">Newsletter</option>
          <option value="thank_you">Thank you</option>
          <option value="invitation">Invitation</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm">
          <AlertCircle className="w-4 h-4" /> Could not load campaigns.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Mail className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No campaigns yet. Create one or use Compose.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-medium">
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Kind</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Sent</th>
                <th className="px-6 py-3.5">Opens</th>
                <th className="px-6 py-3.5">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((n: any) => (
                <tr key={n.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <Link href={`/newsletters/${n.id}/log`} className="font-medium text-slate-900 hover:text-[#0A2540]">
                      {n.subject}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{n.company_name || n.company || '—'}</td>
                  <td className="px-6 py-4 text-slate-500 capitalize text-xs">{(n.kind || '—').replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4"><StatusBadge status={n.status} /></td>
                  <td className="px-6 py-4 text-slate-600 tabular-nums">{n.total_sent ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-600 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-300" />
                      {n.total_opened ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <MousePointerClick className="w-3.5 h-3.5 text-slate-300" />
                      {n.total_clicked ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
