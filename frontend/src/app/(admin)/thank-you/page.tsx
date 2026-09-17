'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search, Loader2, Heart, Mail, AlertCircle, Plus, Pencil,
} from 'lucide-react';
import { templatesApi, newslettersApi, companiesApi, unwrapList } from '@/lib/api';

const THANK_TYPES = [
  'thank_you_enquiry',
  'thank_you_registration',
  'thank_you_event',
];

export default function ThankYouMailsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [tab, setTab] = useState<'templates' | 'sent'>('templates');

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

  const { data: templates, isLoading: loadingTpl, error: errTpl } = useQuery({
    queryKey: ['thank-you-templates', companyFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (companyFilter) params.company = companyFilter;
      const res = await templatesApi.list(params);
      const d = res.data as any;
      const all = unwrapList<any>(d);
      return all.filter((t) => THANK_TYPES.includes(t.type) || (t.type || '').includes('thank'));
    },
    enabled: tab === 'templates',
  });

  const { data: sent, isLoading: loadingSent, error: errSent } = useQuery({
    queryKey: ['thank-you-sent', debounced, companyFilter],
    queryFn: async () => {
      const params: Record<string, string> = { kind: 'thank_you' };
      if (debounced) params.search = debounced;
      if (companyFilter) params.company = companyFilter;
      const res = await newslettersApi.list(params);
      const raw = res.data as any;
      let list = unwrapList<any>(raw);
      // also include subjects that look like thank-you if kind missing
      if (list.length === 0) {
        const all = await newslettersApi.list(companyFilter ? { company: companyFilter } : {});
        const a = all.data as any;
        list = (Array.isArray(a) ? a : a.results || []).filter(
          (n: any) =>
            (n.kind || '').includes('thank') ||
            (n.subject || '').toLowerCase().includes('thank')
        );
      }
      if (debounced) {
        const q = debounced.toLowerCase();
        list = list.filter((n: any) => (n.subject || '').toLowerCase().includes(q));
      }
      return list;
    },
    enabled: tab === 'sent',
  });

  const tplList = (templates || []).filter((t: any) => {
    if (!debounced) return true;
    const q = debounced.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.subject || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Thank-you mail</h1>
          <p className="text-slate-500 mt-1">
            Templates for enquiry / event / registration thanks · Sent campaigns
          </p>
        </div>
        <Link
          href="/templates/builder?type=thank_you_enquiry"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> New thank-you template
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setTab('templates')}
            className={`px-3 py-2 ${tab === 'templates' ? 'bg-[#0A2540] text-white' : 'bg-white text-slate-600'}`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => setTab('sent')}
            className={`px-3 py-2 ${tab === 'sent' ? 'bg-[#0A2540] text-white' : 'bg-white text-slate-600'}`}
          >
            Sent campaigns
          </button>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'templates' ? 'Search templates…' : 'Search subject…'}
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
      </div>

      {tab === 'templates' && (
        <>
          {errTpl && (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm">
              <AlertCircle className="w-4 h-4" /> Could not load templates.
            </div>
          )}
          {loadingTpl ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : tplList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              <Heart className="w-8 h-8 mx-auto mb-3 opacity-40" />
              No thank-you templates yet. Create one in the builder.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tplList.map((t: any) => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
                      {(t.type || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-3">{t.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 truncate">{t.company_name || '—'}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono truncate">{t.subject}</p>
                  <Link
                    href={`/templates/builder?id=${t.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#0A2540] hover:underline"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit template
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'sent' && (
        <>
          {errSent && (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm">
              <AlertCircle className="w-4 h-4" /> Could not load campaigns.
            </div>
          )}
          {loadingSent ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : !(sent || []).length ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              <Mail className="w-8 h-8 mx-auto mb-3 opacity-40" />
              No thank-you campaigns sent yet. Use Compose with a thank-you type.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3.5 font-medium">Subject</th>
                    <th className="px-6 py-3.5 font-medium">Company</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Sent</th>
                    <th className="px-6 py-3.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(sent || []).map((n: any) => (
                    <tr key={n.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <Link href={`/newsletters/${n.id}/log`} className="font-medium text-slate-900 hover:text-[#0A2540]">
                          {n.subject}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{n.company_name || '—'}</td>
                      <td className="px-6 py-4 capitalize text-slate-600">{n.status}</td>
                      <td className="px-6 py-4 tabular-nums">{n.total_sent ?? '—'}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {n.sent_at || n.created_at
                          ? new Date(n.sent_at || n.created_at).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
