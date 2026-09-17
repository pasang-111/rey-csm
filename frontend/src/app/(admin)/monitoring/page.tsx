'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Activity, AlertCircle, CheckCircle2, Eye, Loader2, Mail,
  MousePointerClick, Radio, RefreshCw, Send, UserMinus, XCircle,
} from 'lucide-react';
import { api, newslettersApi, companiesApi, unwrapList } from '@/lib/api';

type Campaign = {
  id: string;
  subject: string;
  status: string;
  company_name?: string;
  total_recipients?: number;
  total_sent?: number;
  total_opened?: number;
  total_clicked?: number;
  total_unsubscribed?: number;
  sent_at?: string;
  created_at?: string;
  updated_at?: string;
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    sending: 'bg-blue-50 text-blue-700 ring-blue-200',
    queued: 'bg-blue-50 text-blue-700 ring-blue-200',
    scheduled: 'bg-amber-50 text-amber-700 ring-amber-200',
    sent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    failed: 'bg-rose-50 text-rose-700 ring-rose-200',
    draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset capitalize ${map[status] || map.draft}`}>
      {status}
    </span>
  );
}

function eventIcon(ev: string) {
  if (ev === 'sent') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (ev === 'failed' || ev === 'bounced') return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
  if (ev === 'opened') return <Eye className="w-4 h-4 text-blue-500 shrink-0" />;
  if (ev === 'clicked') return <MousePointerClick className="w-4 h-4 text-violet-500 shrink-0" />;
  if (ev === 'unsubscribed') return <UserMinus className="w-4 h-4 text-amber-500 shrink-0" />;
  return <Mail className="w-4 h-4 text-slate-400 shrink-0" />;
}

export default function MonitoringPage() {
  const [companyFilter, setCompanyFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.list();
      const d = res.data as any;
      return unwrapList<any>(d);
    },
  });

  // All recent campaigns — poll while any are active
  const { data: campaigns = [], isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['monitoring-campaigns', companyFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (companyFilter) params.company = companyFilter;
      const res = await newslettersApi.list(params);
      const raw = res.data as any;
      return unwrapList<Campaign>(raw);
    },
    refetchInterval: (q) => {
      const list = (q.state.data as Campaign[]) || [];
      const active = list.some((c) => c.status === 'sending' || c.status === 'queued');
      return active ? 3000 : 10000;
    },
  });

  const active = useMemo(
    () => campaigns.filter((c) => c.status === 'sending' || c.status === 'queued'),
    [campaigns]
  );
  const recent = useMemo(() => campaigns.slice(0, 20), [campaigns]);

  const focusId = selectedId || active[0]?.id || recent[0]?.id || null;

  const { data: liveStats } = useQuery({
    queryKey: ['monitoring-live', focusId],
    queryFn: async () => {
      if (!focusId) return null;
      try {
        const res = await api.get(`/newsletters/${focusId}/live_stats/`);
        return res.data as any;
      } catch {
        return null;
      }
    },
    enabled: !!focusId,
    refetchInterval: 2500,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['monitoring-events', focusId],
    queryFn: async () => {
      if (!focusId) return [];
      try {
        const res = await api.get(`/newsletters/${focusId}/events/`);
        const raw = res.data as any;
        return unwrapList<any>(raw);
      } catch {
        return [];
      }
    },
    enabled: !!focusId,
    refetchInterval: 3000,
  });

  const { data: recipients = [] } = useQuery({
    queryKey: ['monitoring-recipients', focusId],
    queryFn: async () => {
      if (!focusId) return [];
      try {
        const res = await api.get(`/newsletters/${focusId}/recipients/`);
        const raw = res.data as any;
        return unwrapList<any>(raw);
      } catch {
        return [];
      }
    },
    enabled: !!focusId,
    refetchInterval: 4000,
  });

  const focus = campaigns.find((c) => c.id === focusId);
  const totals = useMemo(() => {
    return campaigns.reduce(
      (acc, c) => {
        acc.sent += c.total_sent || 0;
        acc.opened += c.total_opened || 0;
        acc.clicked += c.total_clicked || 0;
        return acc;
      },
      { sent: 0, opened: 0, clicked: 0 }
    );
  }, [campaigns]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#0A2540]" />
            Live monitoring
          </h1>
          <p className="text-slate-500 mt-1">
            Delivery logs, opens, clicks — auto-refreshes while campaigns send
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {active.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {active.length} live
            </span>
          )}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">All companies</option>
            {companies.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Campaigns', value: campaigns.length, icon: Mail },
          { label: 'Active now', value: active.length, icon: Radio },
          { label: 'Total sent', value: totals.sent, icon: Send },
          { label: 'Opens / clicks', value: `${totals.opened} / ${totals.clicked}`, icon: Eye },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-400">{k.label}</span>
              <k.icon className="w-4 h-4 text-slate-300" />
            </div>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      {dataUpdatedAt && (
        <p className="text-xs text-slate-400">
          Last poll {new Date(dataUpdatedAt).toLocaleTimeString()}
          {active.length > 0 ? ' · polling every 3s' : ' · idle poll 10s'}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Campaign list */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-medium text-slate-800 text-sm">
            Campaigns
          </div>
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
          ) : recent.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-400">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
              No campaigns yet. Send from Compose.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {recent.map((c) => {
                const isActive = c.status === 'sending' || c.status === 'queued';
                const selected = c.id === focusId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${
                        selected ? 'bg-slate-50 border-l-2 border-[#0A2540]' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-900 truncate">{c.subject}</div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate">{c.company_name || '—'}</div>
                        </div>
                        <StatusPill status={c.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 tabular-nums">
                        <span>Sent {c.total_sent ?? 0}</span>
                        <span>Open {c.total_opened ?? 0}</span>
                        <span>Click {c.total_clicked ?? 0}</span>
                        {isActive && (
                          <span className="ml-auto text-emerald-600 font-medium flex items-center gap-1">
                            <Radio className="w-3 h-3 animate-pulse" /> live
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-8 space-y-4">
          {!focus ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Select a campaign to monitor delivery.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{focus.subject}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {focus.company_name} · <StatusPill status={focus.status} />
                    </p>
                  </div>
                  <Link
                    href={`/newsletters/${focus.id}/log`}
                    className="text-sm font-medium text-[#0A2540] hover:underline"
                  >
                    Full delivery log →
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Recipients', value: liveStats?.total_recipients ?? focus.total_recipients ?? recipients.length },
                    { label: 'Sent', value: liveStats?.total_sent ?? focus.total_sent ?? 0 },
                    { label: 'Opened', value: liveStats?.total_opened ?? focus.total_opened ?? 0 },
                    { label: 'Clicked', value: liveStats?.total_clicked ?? focus.total_clicked ?? 0 },
                    { label: 'Unsub', value: liveStats?.total_unsubscribed ?? focus.total_unsubscribed ?? 0 },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <div className="text-lg font-semibold text-slate-900 tabular-nums">{s.value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
                {liveStats?.by_status && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(liveStats.by_status).map(([st, count]) => (
                      <span key={st} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg capitalize">
                        {st}: {String(count)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Event stream */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 font-medium text-slate-800 text-sm flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-500" />
                    Event stream
                  </div>
                  {events.length === 0 ? (
                    <div className="px-4 py-10 text-center text-xs text-slate-400">
                      Waiting for events (sent / open / click)…
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                      {events.slice(0, 80).map((ev: any) => (
                        <li key={ev.id} className="px-4 py-2.5 flex items-start gap-2.5">
                          {eventIcon(ev.event)}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-slate-800">
                              <span className="font-medium capitalize">{ev.event}</span>
                              {ev.email && <span className="text-slate-500 text-xs"> · {ev.email}</span>}
                            </div>
                            {ev.detail && (
                              <div className="text-[11px] text-slate-400 truncate">{ev.detail}</div>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">
                            {ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Recipients snapshot */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 font-medium text-slate-800 text-sm">
                    Recipients ({recipients.length})
                  </div>
                  {recipients.length === 0 ? (
                    <div className="px-4 py-10 text-center text-xs text-slate-400">No rows yet.</div>
                  ) : (
                    <div className="max-h-[360px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50 text-slate-500">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Email</th>
                            <th className="text-left px-3 py-2 font-medium">Status</th>
                            <th className="text-right px-3 py-2 font-medium">O/C</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {recipients.slice(0, 100).map((r: any) => (
                            <tr key={r.id} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 font-mono text-slate-700 truncate max-w-[160px]">{r.email}</td>
                              <td className="px-3 py-2 capitalize text-slate-600">{r.status}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                                {r.open_count ?? 0}/{r.click_count ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
