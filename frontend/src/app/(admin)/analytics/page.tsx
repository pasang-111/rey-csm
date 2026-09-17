'use client';

import { TrendingUp, Mail, Users, MousePointerClick, Eye } from 'lucide-react';

const kpis = [
  { label: 'Total Sent (30d)', value: '18,420', change: '+14%', icon: Mail },
  { label: 'Avg Open Rate', value: '42.8%', change: '+2.1%', icon: Eye },
  { label: 'Avg Click Rate', value: '8.4%', change: '+0.6%', icon: MousePointerClick },
  { label: 'New Subscribers', value: '1,248', change: '+18%', icon: Users },
];

const byCompany = [
  { name: 'Rey Properties', sent: 5200, open: 44.2, click: 9.1 },
  { name: 'Rey Homes', sent: 4100, open: 46.8, click: 10.2 },
  { name: 'Sandstone', sent: 2800, open: 38.5, click: 7.4 },
  { name: 'Alpha', sent: 2100, open: 41.0, click: 8.0 },
  { name: 'ABS', sent: 1900, open: 39.2, click: 6.8 },
  { name: 'Others', sent: 2320, open: 40.1, click: 7.9 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Email performance across REY Corporate Group · Australia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{k.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{k.value}</p>
                <p className="text-xs text-emerald-600 font-medium mt-2">{k.change} vs previous</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#0A2540]/10 flex items-center justify-center text-[#0A2540]">
                <k.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Performance by Company</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-500 font-medium">
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Emails Sent</th>
              <th className="px-6 py-3">Open Rate</th>
              <th className="px-6 py-3">Click Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {byCompany.map((c) => (
              <tr key={c.name} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-3.5 text-slate-600">{c.sent.toLocaleString()}</td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[100px] overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.open}%` }} />
                    </div>
                    <span className="text-slate-700">{c.open}%</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-slate-600">{c.click}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
