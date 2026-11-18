'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Award,
  Layers,
  TrendingDown,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export default function CourseAnalyticsPage({ params }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/analytics/courses/${courseId}`);
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

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

  const funnel = analytics?.lessonFunnel || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/courses"
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
            Course Funnel Intelligence
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {analytics?.title || 'Course'} — Completion & Drop-Off Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Step-by-step learner progression funnel, drop-off hotspots, and assessment pass rates
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Enrolled</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {analytics?.totalEnrolled || 0}
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
              <p className="text-[11px] font-medium text-slate-500">Completed Learners</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {analytics?.completedCount || 0} ({analytics?.completionRate || 0}%)
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
              <p className="text-[11px] font-medium text-slate-500">Avg Assessment Score</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {analytics?.avgAssessmentScore || 0}%
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
              <p className="text-[11px] font-medium text-slate-500">Assessment Pass Rate</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {analytics?.assessmentPassRate || 100}%
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lesson Progression Funnel Table */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            Lesson Progression & Dropout Funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-center w-16">Step</TableHead>
                <TableHead className="text-xs">Lesson Title</TableHead>
                <TableHead className="text-xs text-center">Completed Students</TableHead>
                <TableHead className="text-xs text-center">Dropout Rate</TableHead>
                <TableHead className="text-xs">Retention Funnel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-xs text-slate-400">
                    No curriculum lessons found.
                  </TableCell>
                </TableRow>
              ) : (
                funnel.map((step, idx) => {
                  const retentionPct = Math.max(0, 100 - step.dropoffRate);
                  return (
                    <TableRow key={step.lessonId}>
                      <TableCell className="text-xs text-center font-bold text-slate-500">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800">
                        {step.title}
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold text-slate-700">
                        {step.completedStudents}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <span
                          className={`text-xs font-medium ${
                            step.dropoffRate > 40 ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {step.dropoffRate}% drop
                        </span>
                      </TableCell>
                      <TableCell className="text-xs w-48">
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${
                              retentionPct > 60 ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${retentionPct}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

