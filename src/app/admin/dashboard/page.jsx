'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Building2,
  Users,
  Layers,
  GraduationCap,
  ArrowUpRight,
  FolderTree,
  Send,
  Sparkles,
  Video,
  BookOpen,
  FileQuestion,
  BarChart3,
  Cpu,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

export default function OrganizationAdminDashboard() {
  const router = useRouter();
  const [academyInfo, setAcademyInfo] = useState(null);
  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    groups: 0,
    courses: 0,
    videos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, academyRes, usersRes, deptsRes, groupsRes, coursesRes, videosRes] =
          await Promise.all([
            fetch('/api/v1/auth/me'),
            fetch('/api/v1/academy'),
            fetch('/api/v1/users?limit=1'),
            fetch('/api/v1/departments'),
            fetch('/api/v1/groups'),
            fetch('/api/v1/courses?limit=1'),
            fetch('/api/v1/video/projects'),
          ]);

        const [meData, academyData, usersData, deptsData, groupsData, coursesData, videosData] =
          await Promise.all([
            meRes.json(),
            academyRes.json(),
            usersRes.json(),
            deptsRes.json(),
            groupsRes.json(),
            coursesRes.json(),
            videosRes.json(),
          ]);

        if (!meData.success) {
          router.push('/login');
          return;
        }

        if (academyData.success) {
          setAcademyInfo(academyData.data?.academy);
        }

        setStats({
          users: usersData.meta?.pagination?.total || usersData.data?.length || 0,
          departments: deptsData.data?.length || 0,
          groups: groupsData.data?.length || 0,
          courses: coursesData.meta?.pagination?.total || coursesData.data?.items?.length || 0,
          videos: videosData.data?.items?.length || 0,
        });
      } catch (err) {
        console.error('Failed to load admin dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Organization Console
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academy Management Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {academyInfo?.name || 'Acme Global University'} — Multi-tenant AI course studio, video pipeline, and learner telemetry
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/admin/studio/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI Course Wizard
            </Button>
          </Link>
          <Link href="/admin/courses/create">
            <Button variant="outline" size="sm" className="text-xs">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Manual Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Learners & Staff
              </p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{stats.users}</h4>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Courses in Catalog
              </p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{stats.courses}</h4>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                AI Video Projects
              </p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{stats.videos}</h4>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Video className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Departments
              </p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{stats.departments}</h4>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <FolderTree className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Learner Groups
              </p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{stats.groups}</h4>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Control Workspaces Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
          Core Workspaces & Studios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Course Studio */}
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  AI Course Studio
                </span>
                <Badge variant="success">AI-Native</Badge>
              </CardTitle>
              <CardDescription>
                Upload PDFs/docs, extract knowledge chunks, generate verified outlines & curriculum.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Link href="/admin/studio" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Studio
                  </Button>
                </Link>
                <Link href="/admin/studio/new">
                  <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                    New Course
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Video Studio */}
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  AI Video Studio
                </span>
                <Badge variant="primary">Direct Server</Badge>
              </CardTitle>
              <CardDescription>
                Convert lessons into multi-scene video scripts, voiceovers, subtitles, and rendered MP4s.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Link href="/admin/video" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Video Dashboard
                  </Button>
                </Link>
                <Link href="/admin/video/create">
                  <Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-700 text-white">
                    New Video
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Course Catalog */}
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Curriculum & Courses
                </span>
                <span className="text-xs font-semibold text-slate-500">{stats.courses} Active</span>
              </CardTitle>
              <CardDescription>
                Structure modules, publish content, manage prerequisites, and review source changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/admin/courses">
                <Button variant="outline" size="sm" className="w-full text-xs" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                  Manage Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Assessments & Gradebook */}
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-amber-600" />
                  Quizzes & Assessments
                </span>
                <Badge variant="outline">Auto-Grading</Badge>
              </CardTitle>
              <CardDescription>
                AI question generator, passing score thresholds, gradebook tracking, and remediation.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Link href="/admin/assessments" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Question Banks
                  </Button>
                </Link>
                <Link href="/admin/gradebook" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Gradebook
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Members & Hierarchy */}
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  Roster & Hierarchy
                </span>
                <span className="text-xs font-semibold text-slate-500">{stats.users} Members</span>
              </CardTitle>
              <CardDescription>
                Organize members by corporate departments, groups, assign roles, and issue invitations.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Link href="/admin/users" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Members
                  </Button>
                </Link>
                <Link href="/admin/invitations" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Invite
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Reports */}
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-rose-600" />
                  Analytics & Reports
                </span>
                <Badge variant="neutral">Real-Time</Badge>
              </CardTitle>
              <CardDescription>
                Completion funnels, department benchmarks, at-risk learner alerts, and instant CSV exports.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Link href="/admin/analytics" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Analytics
                  </Button>
                </Link>
                <Link href="/admin/reports" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Exports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
