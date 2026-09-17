'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Mail, CheckCircle2, XCircle, Eye,
  MousePointerClick, RefreshCw, Radio, UserMinus,
} from 'lucide-react';
import { api, newslettersApi } from '@/lib/api';

export default function DeliveryLogPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const { data: campaign, isLoading: loadingCampaign, dataUpdatedAt } = useQuery({
    queryKey: ['newsletter', id],
    queryFn: async () => (await newslettersApi.get(id)).data as any,
    enabled: !!id,
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.status;
      return s === 'sending' || s === 'queued' ? 2500 : 8000;
    },
  });

  const live = campaign?.status === 'sending' || campaign?.status === 'queued';

  const { data: liveStats } = useQuery({
    queryKey: ['newsletter-live', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/newsletters/${id}/live_stats/`);
        return res.data as any;
      } catch {
        return null;
      }
    },
    enabled: !!id,
    refetchInterval: live ? 2000 : 10000,
  });

  const { data: events, isLoading: loadingEvents, refetch } = useQuery({
    queryKey: ['newsletter-events', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/newsletters/${id}/events/`);
        const raw = res.data as any;
        return Array.isArray(raw) ? raw : raw.results || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
    refetchInterval: live ? 2500 : 10000,
  });

  const { data: recipients } = useQuery({
    queryKey: ['newsletter-recipients', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/newsletters/${id}/recipients/`);
        const raw = res.data as any;
        return Array.isArray(raw) ? raw : raw.results || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
    refetchInterval: live ? 3000 : 12000,
  });

  if (loadingCampaign) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const c = campaign || {};
  const stats = liveStats || c;
  const eventList = events || [];
  const recipList = recipients || [];

  const eventIcon = (ev: string) => {
    if (ev === 'sent') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (ev === 'failed' || ev === 'bounced') return <XCircle className="w-4 h-4 text-rose-500" />;
    if (ev === 'opened') return <Eye className="w-4 h-4 text-blue-500" />;
    if (ev === 'clicked') return <MousePointerClick className="w-4 h-4 text-violet-500" />;
    if (ev === 'unsubscribed') return <UserMinus className="w-4 h-4 text-amber-500" />;
    return <Mail className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/newsletters" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to campaigns
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{c.subject || 'Delivery log'}</h1>
          <p className="text-slate-500 mt-1 capitalize flex items-center gap-2">
            <span>{c.status}</span>
            <span>·</span>
            <span>{c.company_name || 'Campaign'}</span>
            {live && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" /> Live tracking
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Recipients', value: stats.total_recipients ?? recipList.length },
          { label: 'Sent', value: stats.total_sent ?? 0 },
          { label: 'Opened', value: stats.total_opened ?? 0 },
          { label: 'Clicked', value: stats.total_clicked ?? 0 },
          { label: 'Unsubscribed', value: stats.total_unsubscribed ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="text-2xl font-semibold text-slate-900 tabular-nums">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {live && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Sending in progress — this page auto-refreshes every few seconds.
          {dataUpdatedAt ? (
            <span className="text-blue-600/80"> Last update {new Date(dataUpdatedAt).toLocaleTimeString()}</span>
          ) : null}
        </div>
      )}

      {/* Recipients */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-medium text-slate-800 flex items-center justify-between">
          <span>Recipients</span>
          <span className="text-xs font-normal text-slate-400">{recipList.length} rows</span>
        </div>
        {recipList.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-400 text-center">No recipient rows yet.</div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Opens</th>
                  <th className="px-6 py-3">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipList.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-mono text-xs text-slate-700">{r.email}</td>
                    <td className="px-6 py-3 text-slate-600">{r.full_name || '—'}</td>
                    <td className="px-6 py-3 capitalize text-slate-600">{r.status}</td>
                    <td className="px-6 py-3 tabular-nums">{r.open_count ?? 0}</td>
                    <td className="px-6 py-3 tabular-nums">{r.click_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-medium text-slate-800">
          Live event stream
        </div>
        {loadingEvents ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
        ) : eventList.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-400 text-center">
            No events yet. Opens and clicks appear here when recipients engage.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {eventList.map((ev: any) => (
              <li key={ev.id} className="px-6 py-3 flex items-start gap-3">
                <div className="mt-0.5">{eventIcon(ev.event)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-800">
                    <span className="font-medium capitalize">{ev.event}</span>
                    {ev.email && <span className="text-slate-500"> · {ev.email}</span>}
                  </div>
                  {ev.detail && <div className="text-xs text-slate-400 mt-0.5 truncate">{ev.detail}</div>}
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {ev.created_at ? new Date(ev.created_at).toLocaleString() : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
