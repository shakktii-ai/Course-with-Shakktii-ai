'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import {
  Users,
  GraduationCap,
  Clock,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [resOverview, resDepts, resAtRisk] = await Promise.all([
        fetch('/api/v1/analytics/overview'),
        fetch('/api/v1/analytics/departments'),
        fetch('/api/v1/analytics/at-risk?thresholdDays=14'),
      ]);

      const [dataOverview, dataDepts, dataAtRisk] = await Promise.all([
        resOverview.json(),
        resDepts.json(),
        resAtRisk.json(),
      ]);

      if (dataOverview.success) setOverview(dataOverview.data);
      if (dataDepts.success) setDepartments(dataDepts.data || []);
      if (dataAtRisk.success) setAtRisk(dataAtRisk.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            Organization Analytics & Learning Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Learner progression, department benchmarks, dropout warnings, and course completion funnels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/reports">
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              Reports & Exports
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Enrolled Learners</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {(overview?.totalLearners || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Course Completion Rate</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {overview?.completionRate || 0}%
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Study Hours</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {(overview?.totalStudyHours || 0).toLocaleString()} hrs
              </p>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Avg Assessment Score</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {overview?.avgAssessmentScore || 0}%
              </p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Certificates Issued</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {(overview?.totalCertificates || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Department Performance Benchmarks */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Department Benchmarks & Completion
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Comparing enrollment progress and assessment accuracy across departments
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Department</TableHead>
                    <TableHead className="text-xs text-center">Members</TableHead>
                    <TableHead className="text-xs text-center">Enrollments</TableHead>
                    <TableHead className="text-xs text-center">Completion %</TableHead>
                    <TableHead className="text-xs text-right">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-xs text-slate-400">
                        No department data registered yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.departmentId}>
                        <TableCell className="text-xs font-semibold text-slate-800">
                          {dept.name} ({dept.code})
                        </TableCell>
                        <TableCell className="text-xs text-center text-slate-600">
                          {dept.memberCount}
                        </TableCell>
                        <TableCell className="text-xs text-center text-slate-600">
                          {dept.enrollmentsCount}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <span className="font-bold text-emerald-700">{dept.completionRate}%</span>
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-slate-700">
                          {dept.avgAssessmentScore}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Popular Courses */}
        <div>
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Popular Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {(overview?.popularCourses || []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No active enrollments yet.</p>
              ) : (
                overview.popularCourses.map((c, i) => (
                  <div
                    key={c.courseId}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-slate-800 truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {c.enrollmentsCount} active learners
                      </p>
                    </div>
                    <Link
                      href={`/admin/courses/${c.courseId}/analytics`}
                      className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center font-medium"
                    >
                      Funnel
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* At-Risk Learner Watchlist */}
      <Card className="border-amber-200 bg-amber-50/10">
        <CardHeader className="border-b border-amber-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                At-Risk Learner Dropout Watchlist
              </CardTitle>
              <p className="text-xs text-slate-500">
                Learners with 14+ days of inactivity or multiple failing assessment attempts
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
            {atRisk.length} At-Risk Detected
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Learner Name</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Course</TableHead>
                <TableHead className="text-xs text-center">Progress</TableHead>
                <TableHead className="text-xs text-center">Risk Factor</TableHead>
                <TableHead className="text-xs">Diagnosis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atRisk.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-400">
                    No learners currently flagged as at-risk. Great job!
                  </TableCell>
                </TableRow>
              ) : (
                atRisk.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs font-semibold text-slate-800">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{item.email}</TableCell>
                    <TableCell className="text-xs text-slate-700">{item.courseTitle}</TableCell>
                    <TableCell className="text-xs text-center font-bold text-slate-700">
                      {item.percentComplete}%
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.riskFactor === 'HIGH'
                            ? 'border-rose-300 text-rose-700 bg-rose-50'
                            : 'border-amber-300 text-amber-700 bg-amber-50'
                        }`}
                      >
                        {item.riskFactor}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 italic">
                      {item.riskReason}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

