'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Search, UserPlus, CheckCircle2, XCircle,
  Loader2, FileSpreadsheet, X, AlertCircle, Trash2, RefreshCw, Pencil,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { subscribersApi, companiesApi, unwrapList, unwrapCount } from '@/lib/api';

type Subscriber = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  home_address?: string;
  company: string;
  company_name?: string;
  is_subscribed: boolean;
  source: string;
  created_at: string;
};

type Company = { id: string; name: string; short_name?: string; slug: string };

type SortField = 'full_name' | 'email' | 'created_at' | 'subscribed_at';

const PAGE_SIZE = 25;

export default function SubscribersPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState<string>('-created_at');

  const [showImport, setShowImport] = useState(false);
  const [importCompany, setImportCompany] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editSub, setEditSub] = useState<Subscriber | null>(null);
  const [newSub, setNewSub] = useState({
    full_name: '', email: '', phone: '', home_address: '', company: '', is_subscribed: true,
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [companyFilter, statusFilter, sourceFilter, ordering]);

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.list();
      const d = res.data;
      return unwrapList<Company>(d);
    },
  });
  const companies = companiesData || [];

  const { data: subsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['subscribers', debouncedSearch, companyFilter, statusFilter, sourceFilter, page, ordering],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        page_size: PAGE_SIZE,
        ordering,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (companyFilter) params.company = companyFilter;
      if (statusFilter === 'true' || statusFilter === 'false') params.is_subscribed = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      const res = await subscribersApi.list(params as any);
      const d = res.data;
      return {
        results: unwrapList<Subscriber>(d),
        count: unwrapCount(d, unwrapList(d).length),
        next: d.next || null,
        previous: d.previous || null,
      };
    },
  });

  const subscribers = subsData?.results || [];
  const totalCount = subsData?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const toggleSort = (field: SortField) => {
    setOrdering((prev) => {
      if (prev === field) return `-${field}`;
      if (prev === `-${field}`) return field;
      return field;
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (ordering === field) return <ArrowUp className="w-3.5 h-3.5 inline ml-1" />;
    if (ordering === `-${field}`) return <ArrowDown className="w-3.5 h-3.5 inline ml-1" />;
    return <ArrowUpDown className="w-3.5 h-3.5 inline ml-1 opacity-40" />;
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !importCompany) throw new Error('Select a company and CSV file');
      const fd = new FormData();
      fd.append('company', importCompany);
      fd.append('file', selectedFile);
      const res = await subscribersApi.importCsv(fd);
      return res.data;
    },
    onSuccess: (data) => {
      setImportResult(data);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newSub) => subscribersApi.create(data),
    onSuccess: () => {
      setShowAdd(false);
      setNewSub({ full_name: '', email: '', phone: '', home_address: '', company: '', is_subscribed: true });
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      subscribersApi.update(id, data),
    onSuccess: () => {
      setShowEdit(false);
      setEditSub(null);
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscribersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscribers'] }),
  });

  const toggleSubMutation = useMutation({
    mutationFn: ({ id, subscribed }: { id: string; subscribed: boolean }) =>
      subscribed ? subscribersApi.unsubscribe(id) : subscribersApi.resubscribe(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscribers'] }),
  });

  const onFile = useCallback((file: File | null) => {
    if (!file) return;
    const ok = file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!ok) {
      alert('Please upload a .csv or .xlsx file');
      return;
    }
    setSelectedFile(file);
    setImportResult(null);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  // Page numbers window (e.g. 1 2 3 … 16)
  const pageNumbers = (() => {
    const pages: (number | '…')[] = [];
    const max = totalPages;
    if (max <= 7) {
      for (let i = 1; i <= max; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(max - 1, page + 1); i++) pages.push(i);
    if (page < max - 2) pages.push('…');
    pages.push(max);
    return pages;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscribers</h1>
          <p className="text-slate-500 mt-1">
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} contact${totalCount !== 1 ? 's' : ''}`}
            {!isLoading && totalPages > 1 && (
              <span className="text-slate-400"> · Page {page} of {totalPages}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setShowImport(true); setImportResult(null); setSelectedFile(null); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => {
              setShowAdd(true);
              if (companies[0]) setNewSub((s) => ({ ...s, company: companies[0].id }));
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium hover:bg-[#0A2540]/90 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Subscriber
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white min-w-[150px]"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.short_name || c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="true">Subscribed</option>
          <option value="false">Unsubscribed</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
        >
          <option value="">All Sources</option>
          <option value="import">Import</option>
          <option value="manual">Manual</option>
          <option value="website">Website</option>
          <option value="enquiry">Enquiry</option>
          <option value="registration">Registration</option>
        </select>
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
        >
          <option value="-created_at">Newest first</option>
          <option value="created_at">Oldest first</option>
          <option value="full_name">Name A–Z</option>
          <option value="-full_name">Name Z–A</option>
          <option value="email">Email A–Z</option>
          <option value="-email">Email Z–A</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading subscribers…
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-20">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No subscribers match these filters</p>
            <p className="text-sm text-slate-400 mt-1">Try clearing filters or import a CSV</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-medium">
                    <th
                      className="px-6 py-3.5 cursor-pointer select-none hover:text-slate-800"
                      onClick={() => toggleSort('full_name')}
                    >
                      Name <SortIcon field="full_name" />
                    </th>
                    <th
                      className="px-6 py-3.5 cursor-pointer select-none hover:text-slate-800"
                      onClick={() => toggleSort('email')}
                    >
                      Email <SortIcon field="email" />
                    </th>
                    <th className="px-6 py-3.5">Phone</th>
                    <th className="px-6 py-3.5">Company</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Source</th>
                    <th
                      className="px-6 py-3.5 cursor-pointer select-none hover:text-slate-800"
                      onClick={() => toggleSort('created_at')}
                    >
                      Added <SortIcon field="created_at" />
                    </th>
                    <th className="px-6 py-3.5 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">{s.full_name}</td>
                      <td className="px-6 py-4 text-slate-600">{s.email}</td>
                      <td className="px-6 py-4 text-slate-500">{s.phone || '—'}</td>
                      <td className="px-6 py-4 text-slate-600">{s.company_name || '—'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleSubMutation.mutate({ id: s.id, subscribed: s.is_subscribed })}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition"
                          style={{
                            background: s.is_subscribed ? '#ecfdf5' : '#f1f5f9',
                            color: s.is_subscribed ? '#047857' : '#64748b',
                          }}
                        >
                          {s.is_subscribed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {s.is_subscribed ? 'Subscribed' : 'Unsubscribed'}
                        </button>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-500">{s.source}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('en-AU') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setEditSub(s); setShowEdit(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete ${s.full_name}?`)) deleteMutation.mutate(s.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of{' '}
                  {totalCount.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {pageNumbers.map((n, i) =>
                    n === '…' ? (
                      <span key={`e${i}`} className="px-2 text-slate-400 text-sm">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPage(n as number)}
                        className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition ${
                          page === n
                            ? 'bg-[#0A2540] text-white'
                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Import Subscribers (CSV)</h2>
              <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                <select
                  value={importCompany}
                  onChange={(e) => setImportCompany(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">Select company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  dragOver ? 'border-[#0A2540] bg-[#0A2540]/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] || null)}
                />
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-700">Drop CSV here or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">Comma-separated · .csv or .xlsx</p>
                  </div>
                )}
              </div>
              {importMutation.isError && (
                <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{(importMutation.error as any)?.response?.data?.error || (importMutation.error as Error).message || 'Import failed'}</span>
                </div>
              )}
              {importResult && (
                <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800 space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Import complete
                  </p>
                  <p>Created: {importResult.created} · Updated: {importResult.updated} · Skipped: {importResult.skipped} · Errors: {importResult.errors}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setShowImport(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                Close
              </button>
              <button
                disabled={!selectedFile || !importCompany || importMutation.isPending}
                onClick={() => importMutation.mutate()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {importMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Upload & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold">Add Subscriber</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              className="p-6 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(newSub);
              }}
            >
              <input required placeholder="Full name" value={newSub.full_name} onChange={(e) => setNewSub({ ...newSub, full_name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
              <input required type="email" placeholder="Email" value={newSub.email} onChange={(e) => setNewSub({ ...newSub, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
              <input placeholder="Phone" value={newSub.phone} onChange={(e) => setNewSub({ ...newSub, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
              <input placeholder="Home address" value={newSub.home_address} onChange={(e) => setNewSub({ ...newSub, home_address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
              <select required value={newSub.company} onChange={(e) => setNewSub({ ...newSub, company: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="">Select company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {createMutation.isError && (
                <p className="text-sm text-rose-600">
                  {(createMutation.error as any)?.response?.data?.email?.[0] || (createMutation.error as Error).message || 'Failed'}
                </p>
              )}
              <button type="submit" disabled={createMutation.isPending} className="w-full py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Subscriber
              </button>
            </form>
          </div>
        </div>
      )}
      {showEdit && editSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Subscriber</h2>
              <button type="button" onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editSub) return;
                const sub = editSub;
                updateMutation.mutate({
                  id: sub.id,
                  data: {
                    full_name: sub.full_name,
                    email: sub.email,
                    phone: sub.phone || '',
                    company: sub.company,
                    is_subscribed: sub.is_subscribed,
                  },
                });
              }}
            >
              <div>
                <label className="text-xs font-medium text-slate-600">Full name</label>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  value={editSub.full_name}
                  onChange={(e) => setEditSub((prev) => prev ? { ...prev, full_name: e.target.value } : prev)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Email</label>
                <input type="email" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  value={editSub.email}
                  onChange={(e) => setEditSub((prev) => prev ? { ...prev, email: e.target.value } : prev)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Phone</label>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  value={editSub.phone || ''}
                  onChange={(e) => setEditSub((prev) => prev ? { ...prev, phone: e.target.value } : prev)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Company</label>
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
                  value={editSub.company}
                  onChange={(e) => setEditSub((prev) => prev ? { ...prev, company: e.target.value } : prev)}>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={updateMutation.isPending}
                className="w-full py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
