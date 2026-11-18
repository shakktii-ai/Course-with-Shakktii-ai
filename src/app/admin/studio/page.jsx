'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  BookOpen,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  PlusCircle,
  Database,
  BarChart2,
  AlertCircle,
  Layers,
} from 'lucide-react';

export default function AIStudioDashboardPage() {
  const [reviews, setReviews] = useState([]);
  const [sources, setSources] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudioState = useCallback(async () => {
    setLoading(true);
    try {
      const [resRev, resSrc, resUsg] = await Promise.all([
        fetch('/api/v1/ai/reviews'),
        fetch('/api/v1/sources'),
        fetch('/api/v1/ai/usage'),
      ]);

      const [dataRev, dataSrc, dataUsg] = await Promise.all([
        resRev.json(),
        resSrc.json(),
        resUsg.json(),
      ]);

      if (dataRev.success) setReviews(dataRev.data || []);
      if (dataSrc.success) setSources(dataSrc.data || []);
      if (dataUsg.success) setUsage(dataUsg.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudioState();
  }, [fetchStudioState]);

  const pendingReviews = reviews.filter((r) => r.status === 'PENDING_REVIEW');
  const approvedReviews = reviews.filter((r) => r.status === 'APPROVED');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-emerald-600" />
            AI Course Studio & Verification Engine
          </h1>
          <p className="text-sm text-slate-500">
            Generate source-grounded, multi-module curricula from documents with automated citations and review workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/source-library">
            <Button variant="outline">
              <Database className="w-4 h-4 mr-1.5" /> Source Library
            </Button>
          </Link>
          <Link href="/admin/studio/new">
            <Button>
              <PlusCircle className="w-4 h-4 mr-1.5" /> Launch Course Wizard
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Pending Review</div>
              <div className="text-2xl font-bold text-slate-900">{pendingReviews.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Approved Courses</div>
              <div className="text-2xl font-bold text-slate-900">{approvedReviews.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Source Documents</div>
              <div className="text-2xl font-bold text-slate-900">{sources.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Tokens Generated</div>
              <div className="text-2xl font-bold text-slate-900">{usage?.totalTokens?.toLocaleString() || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fast Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Document-to-Course Wizard
            </CardTitle>
            <CardDescription>
              Select uploaded technical documentation, define target audience, and generate grounded course outlines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/studio/new">
              <Button className="w-full">
                Start Generation Wizard &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              AI Content Assistant
            </CardTitle>
            <CardDescription>
              Rewrite, simplify, translate, or generate knowledge check quizzes for existing lesson materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/studio/editor">
              <Button variant="outline" className="w-full">
                Open AI Editor &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Source Ingestion Library
            </CardTitle>
            <CardDescription>
              Upload PDFs, DOCX, PPTX, or Markdown files and run semantic chunking and embedding indexing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/source-library">
              <Button variant="outline" className="w-full">
                Manage Documents &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Review Queue Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI Approval Queue ({reviews.length})</CardTitle>
            <CardDescription>
              Human-in-the-loop content review: verify citations, check source passages, and publish to LMS.
            </CardDescription>
          </div>
          <Link href="/admin/studio/review">
            <Button variant="outline" size="sm">
              Reviewer Center
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">No courses pending review</p>
                <p className="text-xs text-slate-400 mt-1">Generated courses will appear here for verification.</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {r.courseId?.title || 'Generated Course'}
                      </span>
                      <Badge variant={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {r.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Citations: {r.verifiedCitationsCount || 0} / {r.citationCount || 0} Verified</span>
                      <span>• Generated on {new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link href={`/admin/studio/review?reviewId=${r._id}`}>
                    <Button size="sm" variant="outline">
                      Review & Verify &rarr;
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

