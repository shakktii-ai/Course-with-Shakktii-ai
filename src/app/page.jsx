import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Video,
  Bot,
  ShieldCheck,
  Building2,
  Users,
  Award,
  ArrowRight,
  Database,
  BarChart3,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata = {
  title: 'AI Academy — Enterprise AI-Native Learning Management Platform',
  description:
    'Multi-tenant corporate learning management system featuring source-grounded AI course generation, AI video studio, personalized AI tutor, verifiable credentials, and deep analytics.',
};

const DEMO_ACCOUNTS = [
  {
    role: 'Autonomous Student / Learner',
    email: 'student@acme.edu',
    password: 'Password123!',
    tag: 'Auto-Pilot Mode',
    color: 'border-emerald-300 bg-emerald-50 text-emerald-950',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Upload any document or topic: courses, lessons, and quizzes are automatically generated and published with zero instructor steps!',
    destination: '/learn/auto-generate',
  },
  {
    role: 'Organization Admin',
    email: 'admin@acme.edu',
    password: 'Password123!',
    tag: 'Tenant Admin',
    color: 'border-slate-300 bg-slate-50 text-slate-900',
    badgeColor: 'bg-slate-200 text-slate-800',
    description: 'Configure academy branding, departments, user groups, employee rosters, and AI token quotas.',
    destination: '/admin/dashboard',
  },
  {
    role: 'Platform Super Admin',
    email: 'superadmin@aiacademy.local',
    password: 'Password123!',
    tag: 'Global SaaS',
    color: 'border-slate-800 bg-slate-900 text-white',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    description: 'Manage multi-tenant organizations, subscription tiers, audit logs, and global user directory.',
    destination: '/platform/dashboard',
  },
];

const PLATFORM_CAPABILITIES = [
  {
    title: 'AI Course Studio',
    icon: Sparkles,
    badge: 'Source-Grounded',
    description:
      'Upload technical PDFs and documentation. The engine extracts semantic chunks, generates structured multi-module curricula, generates lesson content, and audits source citations.',
  },
  {
    title: 'AI Video Studio',
    icon: Video,
    badge: 'Direct Render',
    description:
      'Transform lessons into storyboarded video scenes with automated narration scripting, multi-speaker voice synthesis, subtitles, and server-side MP4 video rendering.',
  },
  {
    title: 'Contextual AI Tutor',
    icon: Bot,
    badge: 'Zero Hallucinations',
    description:
      'Personalized learning assistant embedded directly into courses. Delivers grounded responses citing course materials, tracks student confusion topics, and supports multilingual tutoring.',
  },
  {
    title: 'Multi-Tenant Isolation',
    icon: ShieldCheck,
    badge: 'Cryptographic Security',
    description:
      'Strict tenantId partition enforced across all MongoDB queries, uploads, background jobs, and API routes. Prevents cross-tenant leaks with HTTP-only session cookies and RBAC.',
  },
  {
    title: 'Verifiable Certifications',
    icon: Award,
    badge: 'Tamper-Evident',
    description:
      'Issue cryptographic completion certificates upon passing assessments. Public verification endpoint allows employers and accreditors to validate authenticity instantly.',
  },
  {
    title: 'Executive Telemetry & Reports',
    icon: BarChart3,
    badge: 'Real-Time Insights',
    description:
      'Learner progress streaks, department benchmark comparisons, at-risk learner alerts, AI token budget consumption, and automated CSV/JSON reporting exports.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                AI Academy
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Enterprise LMS
                </span>
              </span>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                AI-Native Multi-Tenant Learning Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI-Native Enterprise Architecture • Direct Server Execution</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            The Complete AI Learning Platform for Modern Enterprises
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Create source-grounded AI courses from technical documents, generate AI narrated videos, empower learners with an adaptive 24/7 AI Tutor, and issue verifiable credentials.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/login">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                <span>Access Demo Dashboards</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/verify/cert_demo_verified_code_2026_xyz">
              <Button variant="outline" size="lg">
                <Award className="w-4 h-4 mr-2 text-emerald-600" />
                <span>Verify Demo Certificate</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Demo Accounts Quick-Launch Card Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Interactive Testing Launchpad
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-seeded test credentials ready for end-to-end evaluation
              </p>
            </div>
            <Link href="/login" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              Sign In with Credentials &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DEMO_ACCOUNTS.map((acc) => (
              <Card key={acc.role} className={`border ${acc.color} p-5 flex flex-col justify-between`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${acc.badgeColor}`}>
                      {acc.tag}
                    </span>
                    <Lock className="w-3.5 h-3.5 opacity-60" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">{acc.role}</h3>
                    <p className="text-xs opacity-80 mt-1 leading-relaxed">
                      {acc.description}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-mono space-y-1">
                    <div className="truncate">
                      <span className="opacity-60">Email: </span>
                      <strong className="select-all">{acc.email}</strong>
                    </div>
                    <div>
                      <span className="opacity-60">Pass: </span>
                      <strong className="select-all">{acc.password}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-black/10 dark:border-white/10">
                  <Link href={`/login?email=${encodeURIComponent(acc.email)}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs font-medium">
                      <span>Launch Role</span>
                      <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Feature Capabilities */}
        <div className="space-y-4 pt-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise AI LMS Engine Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Production-ready multi-tenant system built on Next.js App Router and MongoDB Atlas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <Card key={cap.title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-600">
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="neutral">{cap.badge}</Badge>
                    </div>
                    <CardTitle className="text-base">{cap.title}</CardTitle>
                    <CardDescription className="text-xs">{cap.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Platform Architecture Status Bar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Direct Execution Runtime:</span>{' '}
              <span className="text-slate-600">
                Next.js Route Handlers • MongoDB Atlas • Pure JavaScript (Zero TypeScript)
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero Redis / No BullMQ
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-Tenant Scoped
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct Job Persistence
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
            <span>© {new Date().getFullYear()} AI Academy SaaS. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Next.js 15 App Router</span>
            <span>MongoDB Atlas Mongoose</span>
            <span>Direct Server AI Pipelines</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
