'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Building2,
  Users,
  ShieldCheck,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PLATFORM_NAV = [
  { label: 'Platform Metrics & Health', href: '/platform/dashboard', icon: Activity },
  { label: 'Tenant Organizations', href: '/platform/organizations', icon: Building2 },
  { label: 'Platform Users', href: '/platform/users', icon: Users },
  { label: 'RBAC Roles & Policies', href: '/platform/roles', icon: ShieldCheck },
  { label: 'Platform Audit Trail', href: '/platform/audit-logs', icon: FileText },
];

export function PlatformShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadIdentity() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        if (mounted && data.success) {
          setUser(data.data);
        }
      } catch (err) {
        console.error('Failed to load session identity', err);
      }
    }
    loadIdentity();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
  };

  const isActive = (href) => {
    if (href === '/platform/dashboard') {
      return pathname === '/platform/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Super Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-800 px-5 flex items-center justify-between shrink-0 bg-slate-950/60">
          <Link href="/platform/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm shrink-0">
              AG
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-white tracking-tight block truncate">
                AI Academy
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400">
                Platform Super Admin
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5">
          <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
            GLOBAL PLATFORM CONTROLS
          </div>
          {PLATFORM_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold border-l-3 border-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Super Admin User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/80 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'Super Admin'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'superadmin@aiacademy.local'}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Link
              href="/admin/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-[11px] font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-slate-400" />
              <span>Org Admin</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-rose-900/60 bg-rose-950/40 text-[11px] font-medium text-rose-300 hover:bg-rose-900/60 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-800 p-1.5 rounded-lg border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Platform Super Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-900 capitalize">
                {pathname.replace('/platform/', '').split('/')[0] || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Execution Runtime Active</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
              className="text-xs text-rose-600 hover:bg-rose-50 h-8"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default PlatformShell;

