'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus, Mail, Star, Loader2, Pencil, Trash2, Copy, Search,
} from 'lucide-react';
import {templatesApi, companiesApi, unwrapList} from '@/lib/api';

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.list();
      const d = res.data as any;
      return unwrapList<any>(d);
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['templates', companyFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (companyFilter) params.company = companyFilter;
      const res = await templatesApi.list(params);
      const d = res.data as any;
      return unwrapList<any>(d);
    },
  });

  const templates = (data || []).filter((t: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.subject || '').toLowerCase().includes(q) ||
      (t.company_name || '').toLowerCase().includes(q)
    );
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setConfirmId(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => templatesApi.duplicate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Email Templates</h1>
          <p className="text-slate-500 mt-1">Create, edit, duplicate and delete branded templates</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/templates/builder?type=custom"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium hover:bg-[#0A2540]/90 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Brand new custom template
          </Link>
          <Link
            href="/templates/builder"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm"
          >
            From library
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
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

      {error && (
        <div className="bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm">Failed to load templates.</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Mail className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No templates yet</p>
          <p className="text-sm text-slate-400 mt-1">Create one in the builder or run seed_templates</p>
          <Link href="/templates/builder" className="inline-flex mt-4 items-center gap-2 px-4 py-2 bg-[#0A2540] text-white rounded-xl text-sm">
            <Plus className="w-4 h-4" /> Create template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: t.primary_color || '#0A2540' }}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  {t.is_default && (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      <Star className="w-3 h-3" /> Default
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mt-4">{t.name}</h3>
              <p className="text-xs text-slate-500 mt-1 capitalize">{(t.type || '').replace(/_/g, ' ')}</p>
              <p className="text-xs text-slate-400 mt-2 truncate">{t.company_name || '—'}</p>
              <p className="text-xs text-slate-400 mt-1 truncate font-mono">{t.subject}</p>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Link
                  href={`/templates/builder?id=${t.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <button
                  type="button"
                  onClick={() => duplicateMutation.mutate(t.id)}
                  disabled={duplicateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
                {confirmId === t.id ? (
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(t.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white"
                    >
                      Confirm
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="px-2 py-1.5 text-xs text-slate-500">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(t.id)}
                    className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
