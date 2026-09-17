'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, Loader2, MessageSquare, Mail, Building2, RefreshCw,
  CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import { enquiriesApi, companiesApi, unwrapList } from '@/lib/api';

const STATUS_OPTIONS = [
  { id: '', label: 'All statuses' },
  { id: 'new', label: 'New' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'converted', label: 'Converted' },
  { id: 'closed', label: 'Closed' },
  { id: 'spam', label: 'Spam' },
];

const statusStyle: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  contacted: 'bg-violet-50 text-violet-700',
  qualified: 'bg-indigo-50 text-indigo-700',
  converted: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
  spam: 'bg-rose-50 text-rose-600',
};

export default function EnquiriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'table' | 'board'>('table');

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
    queryKey: ['enquiries', debounced, companyFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debounced) params.search = debounced;
      if (companyFilter) params.company = companyFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await enquiriesApi.list(params);
      const d = res.data as any;
      return unwrapList<any>(d);
    },
  });

  const list = data || [];

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      enquiriesApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enquiries'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Enquiries</h1>
          <p className="text-slate-500 mt-1">
            Website form leads · Search · Status · Thank-you email tracking
          </p>
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
          <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setView('table')}
              className={`px-3 py-2 ${view === 'table' ? 'bg-[#0A2540] text-white' : 'bg-white text-slate-600'}`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView('board')}
              className={`px-3 py-2 ${view === 'board' ? 'bg-[#0A2540] text-white' : 'bg-white text-slate-600'}`}
            >
              Board
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, message…"
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
          {STATUS_OPTIONS.map((s) => (
            <option key={s.id || 'all'} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm">
          <AlertCircle className="w-4 h-4" /> Could not load enquiries.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
          No enquiries match your filters.
        </div>
      ) : view === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3.5 font-medium">Contact</th>
                <th className="px-5 py-3.5 font-medium">Company</th>
                <th className="px-5 py-3.5 font-medium">Message</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Thank-you</th>
                <th className="px-5 py-3.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((e: any) => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{e.full_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{e.email}</div>
                    {e.phone && <div className="text-xs text-slate-400">{e.phone}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {e.company_name || e.company || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate" title={e.message}>
                    {e.subject ? <span className="font-medium text-slate-700">{e.subject} · </span> : null}
                    {e.message}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={e.status}
                      onChange={(ev) => updateStatus.mutate({ id: e.id, status: ev.target.value })}
                      className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer ${statusStyle[e.status] || statusStyle.new}`}
                    >
                      {STATUS_OPTIONS.filter((s) => s.id).map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    {e.thank_you_sent ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                    {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {['new', 'in_progress', 'contacted', 'converted'].map((col) => {
            const items = list.filter((e: any) => e.status === col);
            return (
              <div key={col} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 min-h-[320px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800 capitalize">{col.replace('_', ' ')}</h3>
                  <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((e: any) => (
                    <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                      <div className="font-medium text-sm text-slate-900">{e.full_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{e.email}</div>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{e.message}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <Building2 className="w-3 h-3" />
                        {e.company_name || '—'}
                        {e.thank_you_sent && (
                          <span className="ml-auto inline-flex items-center gap-0.5 text-emerald-600">
                            <Mail className="w-3 h-3" /> TY
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
