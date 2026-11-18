'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Settings,
  Sparkles,
  Video,
  Database,
  FolderTree,
  BookOpen,
  Layers,
  FileQuestion,
  GraduationCap,
  Award,
  UserCheck,
  Users,
  Network,
  Mail,
  BarChart3,
  Bot,
  Cpu,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Compass,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Academy Branding', href: '/admin/academy', icon: Building2 },
      { label: 'Organization Settings', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    title: 'AI STUDIOS & ASSETS',
    items: [
      { label: 'AI Course Studio', href: '/admin/studio', icon: Sparkles, badge: 'AI' },
      { label: 'AI Video Studio', href: '/admin/video', icon: Video, badge: 'AI' },
      { label: 'Video Clips & Notes', href: '/admin/video/clips', icon: Scissors, badge: 'NEW' },
      { label: 'Source Documents', href: '/admin/source-library', icon: Database },
      { label: 'Media Library', href: '/admin/media-library', icon: FolderTree },
    ],
  },
  {
    title: 'CURRICULUM',
    items: [
      { label: 'Course Catalog', href: '/admin/courses', icon: BookOpen },
      { label: 'Categories', href: '/admin/categories', icon: Layers },
      { label: 'Learning Paths', href: '/admin/learning-paths', icon: Compass },
    ],
  },
  {
    title: 'ASSESSMENTS & ROSTER',
    items: [
      { label: 'Quizzes & Exams', href: '/admin/assessments', icon: FileQuestion },
      { label: 'Gradebook', href: '/admin/gradebook', icon: GraduationCap },
      { label: 'Certificates', href: '/admin/certificates', icon: Award },
      { label: 'Enrollments', href: '/admin/enrollments', icon: UserCheck },
    ],
  },
  {
    title: 'ORGANIZATION & PEOPLE',
    items: [
      { label: 'Learners & Staff', href: '/admin/users', icon: Users },
      { label: 'Departments', href: '/admin/departments', icon: Network },
      { label: 'Learner Groups', href: '/admin/groups', icon: Layers },
      { label: 'Invitations & Import', href: '/admin/invitations', icon: Mail },
    ],
  },
  {
    title: 'ANALYTICS & REPORTS',
    items: [
      { label: 'Overview Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'AI Tutor Insights', href: '/admin/analytics/tutor', icon: Bot },
      { label: 'AI Token Usage', href: '/admin/ai-usage', icon: Cpu },
      { label: 'Scheduled Reports', href: '/admin/reports', icon: FileSpreadsheet },
    ],
  },
];

export function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadIdentity() {
      try {
        const [meRes, acRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/academy'),
        ]);
        const [meData, acData] = await Promise.all([meRes.json(), acRes.json()]);
        if (mounted && meData.success) {
          setUser(meData.data);
        }
        if (mounted && acData.success) {
          setAcademy(acData.data?.academy);
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
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    if (href === '/admin/video') {
      return pathname.startsWith('/admin/video') && !pathname.startsWith('/admin/video/clips');
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Academy Header */}
        <div className="h-16 border-b border-slate-200 px-5 flex items-center justify-between shrink-0 bg-white">
          <Link href="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-emerald-200 shrink-0">
              AC
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-slate-900 tracking-tight block truncate">
                {academy?.name || 'Acme Academy'}
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Organization Studio
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

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
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
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || 'admin@acme.edu'}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Link
              href="/learn/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-slate-400" />
              <span>Learner View</span>
            </Link>
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
              <span className="font-semibold text-slate-700 hidden sm:inline">
                {academy?.name || 'Acme Global University'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <span className="font-medium text-slate-900 capitalize">
                {pathname.replace('/admin/', '').split('/')[0] || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Server Runtime • MongoDB Atlas</span>
            </div>

            <Link href="/learn/dashboard" className="hidden sm:inline-block">
              <Button variant="outline" size="sm" className="text-xs h-8">
                Learner Portal
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

        {/* Child Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default AdminShell;

