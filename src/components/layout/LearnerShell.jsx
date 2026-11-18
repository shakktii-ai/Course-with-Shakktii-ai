'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  BookOpen,
  Bot,
  Award,
  Bookmark,
  FileText,
  History,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const LEARNER_NAV = [
  { label: 'My Learning', href: '/learn/dashboard', icon: GraduationCap },
  { label: '⚡ Auto-Generate Course', href: '/learn/auto-generate', icon: Sparkles, badge: 'AUTO' },
  { label: 'Video Clips & Notes', href: '/learn/video-clips', icon: Scissors, badge: 'NEW' },
  { label: 'Course Catalog', href: '/learn/courses', icon: BookOpen },
  { label: 'AI Tutor', href: '/learn/tutor', icon: Bot, badge: 'AI' },
  { label: 'My Certificates', href: '/learn/certificates', icon: Award },
  { label: 'Bookmarks', href: '/learn/bookmarks', icon: Bookmark },
  { label: 'Study Notes', href: '/learn/notes', icon: FileText },
  { label: 'Learning History', href: '/learn/history', icon: History },
];

export function LearnerShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // If inside immersive player, let the player page take full layout control
  const isImmersivePlayer = pathname.startsWith('/learn/player/');

  useEffect(() => {
    let mounted = true;
    try {
      const cached = sessionStorage.getItem('ai_academy_shell_identity');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.user) setUser(parsed.user);
        if (parsed.academy) setAcademy(parsed.academy);
      }
    } catch {
      // ignore storage errors
    }

    async function loadIdentity() {
      try {
        const [meRes, acRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/academy'),
        ]);
        const [meData, acData] = await Promise.all([meRes.json(), acRes.json()]);
        if (mounted) {
          const nextUser = meData.success ? meData.data : null;
          const nextAcademy = acData.success ? acData.data?.academy : null;
          if (nextUser) setUser(nextUser);
          if (nextAcademy) setAcademy(nextAcademy);
          try {
            sessionStorage.setItem(
              'ai_academy_shell_identity',
              JSON.stringify({ user: nextUser, academy: nextAcademy })
            );
          } catch {
            // ignore
          }
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
      sessionStorage.removeItem('ai_academy_shell_identity');
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
  };

  const isActive = (href) => {
    if (href === '/learn/dashboard') {
      return pathname === '/learn/dashboard';
    }
    return pathname.startsWith(href);
  };

  const canAccessAdmin =
    user?.roles?.includes('ORG_ADMIN') ||
    user?.roles?.includes('INSTRUCTOR') ||
    user?.role === 'SUPER_ADMIN';

  if (isImmersivePlayer) {
    return (
      <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-900 text-white z-50">
        {children}
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans ${
        pathname.startsWith('/learn/tutor')
          ? 'h-screen w-full overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Learner Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-200 px-5 flex items-center justify-between shrink-0 bg-white">
          <Link href="/learn/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-emerald-200 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-slate-900 tracking-tight block truncate">
                {academy?.name || 'Acme Academy'}
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Learner Portal
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
            LEARNING WORKSPACE
          </div>
          {LEARNER_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-3 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Learner User Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || 'Learner'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || 'student@acme.edu'}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {canAccessAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-slate-400" />
                <span>Admin Studio</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-[11px] font-medium text-rose-600 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar (Hidden on full-screen AI Tutor which provides its own rich dedicated header) */}
        {!pathname.startsWith('/learn/tutor') && (
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
                <span className="font-semibold text-slate-700 hidden sm:inline">
                  {academy?.name || 'Acme Global University'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                <span className="font-medium text-slate-900 capitalize">
                  {pathname.replace('/learn/', '').split('/')[0] || 'My Learning'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link href="/learn/auto-generate">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-200" />
                  <span className="hidden sm:inline">⚡ Auto-Generate Course</span>
                  <span className="sm:hidden">Auto-Gen</span>
                </Button>
              </Link>

              <Link href="/learn/tutor">
                <Button variant="outline" size="sm" className="text-xs h-8">
                  <Bot className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>AI Tutor</span>
                </Button>
              </Link>

              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-xs h-8">
                  Profile
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
                className="text-xs text-rose-600 hover:bg-rose-50 h-8"
              >
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </header>
        )}

        {/* Content */}
        <main
          className={`flex-1 min-h-0 ${
            pathname.startsWith('/learn/tutor')
              ? 'overflow-hidden flex flex-col p-0'
              : 'overflow-y-auto p-4 sm:p-6 lg:p-8'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default LearnerShell;

