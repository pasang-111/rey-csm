'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Loader2, Mail, Globe, Plus, Pencil, Trash2, X, Upload,
} from 'lucide-react';
import { companiesApi, unwrapList } from '@/lib/api';

const emptyForm = {
  name: '',
  short_name: '',
  from_email: '',
  website: '',
  tagline: '',
  footer_text: '',
  primary_color: '#0A2540',
  secondary_color: '#C9A227',
  phone: '',
  is_parent: false,
  parent: '',
  is_active: true,
};

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.list({ include_inactive: 'true' });
      return unwrapList<any>(res.data);
    },
  });

  const companies = data || [];
  // One parent card + unique subsidiaries (never list parent twice)
  const parent =
    companies.find((c) => c.is_parent && c.is_active !== false) ||
    companies.find((c) => c.is_parent) ||
    null;
  const children = companies.filter((c) => {
    if (parent && String(c.id) === String(parent.id)) return false;
    if (c.is_parent) return false;
    return true;
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        short_name: form.short_name.trim(),
        from_email: form.from_email.trim(),
        website: form.website.trim(),
        tagline: form.tagline.trim(),
        footer_text: form.footer_text.trim(),
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        phone: form.phone.trim(),
        is_parent: form.is_parent,
        is_active: form.is_active,
      };
      if (form.parent) payload.parent = form.parent;
      else payload.parent = null;
      if (editId) return companiesApi.update(editId, payload);
      return companiesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setModal(null);
      setEditId(null);
      setForm({ ...emptyForm });
      setError('');
    },
    onError: (e: any) => {
      const d = e?.response?.data;
      setError(typeof d === 'object' ? JSON.stringify(d) : e?.message || 'Save failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setConfirmId(null);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => companiesApi.uploadLogo(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditId(null);
    setError('');
    setModal('create');
  };

  const openEdit = (c: any) => {
    setForm({
      name: c.name || '',
      short_name: c.short_name || '',
      from_email: c.from_email || '',
      website: c.website || '',
      tagline: c.tagline || '',
      footer_text: c.footer_text || c.brand_footer || '',
      primary_color: c.primary_color || '#0A2540',
      secondary_color: c.secondary_color || '#C9A227',
      phone: c.phone || '',
      is_parent: !!c.is_parent,
      parent: c.parent || '',
      is_active: c.is_active !== false,
    });
    setEditId(c.id);
    setError('');
    setModal('edit');
  };

  const renderCard = (c: any, isParentCard = false) => (
    <div
      key={c.id}
      className={`rounded-2xl border shadow-sm overflow-hidden ${
        isParentCard ? 'border-transparent' : 'border-slate-200 bg-white'
      } ${c.is_active === false ? 'opacity-60' : ''}`}
      style={
        isParentCard
          ? {
              background: `linear-gradient(135deg, ${c.primary_color || '#0A2540'} 0%, ${c.accent_color || c.primary_color || '#1E3A5F'} 100%)`,
            }
          : undefined
      }
    >
      <div className={`p-5 ${isParentCard ? 'text-white' : ''}`}>
        <div className="flex items-start gap-3">
          {c.logo_url ? (
            <img
              src={c.logo_url}
              alt={c.name}
              className={`h-11 w-11 rounded-xl object-contain ${isParentCard ? 'bg-white/10 p-1' : 'border border-slate-100'}`}
            />
          ) : (
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: isParentCard ? 'rgba(255,255,255,0.15)' : c.primary_color || '#0A2540' }}
            >
              {(c.short_name || c.name || '?').charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className={`text-[10px] uppercase tracking-wide font-medium ${isParentCard ? 'text-white/60' : 'text-slate-400'}`}>
              {c.is_parent ? 'Parent group' : 'Subsidiary'}
              {c.is_active === false ? ' · Inactive' : ''}
            </div>
            <h3 className={`font-semibold truncate ${isParentCard ? 'text-white' : 'text-slate-900'}`}>{c.name}</h3>
            <p className={`text-xs mt-1 leading-relaxed ${isParentCard ? 'text-white/70' : 'text-slate-500'}`}>
              {c.brand_footer || c.footer_text || c.tagline || '—'}
            </p>
          </div>
        </div>

        <div className={`mt-3 space-y-1 text-xs ${isParentCard ? 'text-white/70' : 'text-slate-500'}`}>
          {c.from_email && (
            <div className="flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5" />
              {c.from_email}
            </div>
          )}
          {c.website && (
            <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline">
              <Globe className="w-3.5 h-3.5" />
              {c.website}
            </a>
          )}
        </div>

        <div className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-3 ${isParentCard ? 'border-white/15' : 'border-slate-100'}`}>
          <button
            type="button"
            onClick={() => openEdit(c)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              isParentCard ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <label
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              isParentCard ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadMutation.mutate({ id: c.id, file: f });
              }}
            />
          </label>
          {confirmId === c.id ? (
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => deleteMutation.mutate(c.id)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white"
              >
                Confirm
              </button>
              <button type="button" onClick={() => setConfirmId(null)} className={`text-xs ${isParentCard ? 'text-white/70' : 'text-slate-500'}`}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmId(c.id)}
              className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                isParentCard ? 'text-white/80 hover:bg-white/10' : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Companies</h1>
          <p className="text-slate-500 mt-1">Add, edit, delete brands and upload logos</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      {loadError && (
        <div className="bg-rose-50 text-rose-700 rounded-2xl p-6 text-sm">Could not load companies.</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          {parent && renderCard(parent, true)}
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Subsidiaries ({children.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {children.map((c) => renderCard(c))}
            </div>
          </div>
          {companies.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              <Building2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
              No companies yet. Add one or run seed_rey_companies.
            </div>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {modal === 'create' ? 'Add company' : 'Edit company'}
              </h2>
              <button type="button" onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              className="p-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              {error && <div className="text-xs text-rose-600 bg-rose-50 rounded-lg p-3">{error}</div>}
              <div>
                <label className="text-xs font-medium text-slate-600">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Short name</label>
                  <input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">From email</label>
                  <input type="email" value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Website</label>
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="https://" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Email footer line</label>
                <input value={form.footer_text} onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Name — A Part of the REY Corporate Group." />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Tagline</label>
                <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Primary colour</label>
                  <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Secondary colour</label>
                  <input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Parent company</label>
                <select
                  value={form.parent}
                  onChange={(e) => setForm({ ...form, parent: e.target.value, is_parent: !e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
                  disabled={form.is_parent}
                >
                  <option value="">— None (top-level) —</option>
                  {companies.filter((c) => c.is_parent || !c.parent).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.is_parent}
                  onChange={(e) => setForm({ ...form, is_parent: e.target.checked, parent: e.target.checked ? '' : form.parent })} />
                This is the parent group (REY Corporate)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === 'create' ? 'Create company' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
