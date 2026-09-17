'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Mail, FileText, MessageSquare,
  Building2, Newspaper, BarChart3, LogOut, Send, Heart, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/subscribers', label: 'Subscribers', icon: Users },
  { href: '/compose', label: 'Compose / Invite', icon: Send },
  { href: '/newsletters', label: 'Campaigns & Logs', icon: Mail },
  { href: '/monitoring', label: 'Live monitoring', icon: Activity },
  { href: '/thank-you', label: 'Thank-you mail', icon: Heart },
  { href: '/templates', label: 'Email Templates', icon: FileText },
  { href: '/enquiries', label: 'Enquiries', icon: MessageSquare },
  { href: '/articles', label: 'Articles', icon: Newspaper },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0A2540] text-white flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C9A227] to-[#E8D48B] flex items-center justify-center font-bold text-[#0A2540] text-lg">
          R
        </div>
        <div>
          <div className="font-semibold tracking-wide">REY CMS</div>
          <div className="text-xs text-white/60">Australia</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        {user && (
          <div className="px-3 py-2 text-xs text-white/50 truncate">{user.email}</div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
