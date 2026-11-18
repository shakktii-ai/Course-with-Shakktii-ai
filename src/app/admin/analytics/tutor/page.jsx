'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import {
  BrainCircuit,
  MessageSquare,
  Users,
  Zap,
  ThumbsUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';

export default function AdminTutorAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [confusionTopics, setConfusionTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [resOverview, resTopics] = await Promise.all([
        fetch('/api/v1/tutor/analytics'),
        fetch('/api/v1/tutor/analytics/confusion'),
      ]);

      const [dataOverview, dataTopics] = await Promise.all([
        resOverview.json(),
        resTopics.json(),
      ]);

      if (dataOverview.success) setOverview(dataOverview.data);
      if (dataTopics.success) setConfusionTopics(dataTopics.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleResolveTopic = async (topicId) => {
    setResolvingId(topicId);
    try {
      const res = await fetch('/api/v1/tutor/analytics/confusion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
      });
      const data = await res.json();
      if (data.success) {
        setConfusionTopics((prev) =>
          prev.map((t) => (t._id === topicId ? { ...t, resolved: true } : t))
        );
      }
    } finally {
      setResolvingId(null);
    }
  };

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
            <BrainCircuit className="h-6 w-6 text-emerald-600" />
            AI Tutor & Learning Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time learner inquiry trends, confusion heatmaps, and content gap monitoring
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchAnalytics} className="text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh Metrics
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Conversations</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {overview?.totalConversations || 0}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Active Learners</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {overview?.activeLearnersCount || 0}
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
              <p className="text-[11px] font-medium text-slate-500">Messages Exchanged</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {overview?.totalMessages || 0}
              </p>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <BrainCircuit className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Learner Satisfaction</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {overview?.satisfactionRate || 100}%
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ThumbsUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Tokens Consumed</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {(overview?.tokenUsage?.totalTokens || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confusion Heatmap & Topic Aggregator */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">
              Learner Confusion Heatmap & Recurring Inquiries
            </CardTitle>
            <p className="text-xs text-slate-500">
              Topics where students frequently ask follow-ups, express confusion, or struggle on quizzes
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Topic / Keyword</TableHead>
                <TableHead className="text-xs">Associated Course</TableHead>
                <TableHead className="text-xs text-center">Frequency</TableHead>
                <TableHead className="text-xs text-center">Severity</TableHead>
                <TableHead className="text-xs">Sample Inquiry</TableHead>
                <TableHead className="text-xs text-right">Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {confusionTopics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-400">
                    No active learner confusion topics detected.
                  </TableCell>
                </TableRow>
              ) : (
                confusionTopics.map((topic) => (
                  <TableRow key={topic._id}>
                    <TableCell className="text-xs font-medium text-slate-800">
                      {topic.topic}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {topic.courseId?.title || 'General Academy'}
                    </TableCell>
                    <TableCell className="text-xs text-center font-bold text-slate-700">
                      {topic.queryCount} queries
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          topic.severity === 'HIGH'
                            ? 'border-rose-300 text-rose-700 bg-rose-50'
                            : 'border-amber-300 text-amber-700 bg-amber-50'
                        }`}
                      >
                        {topic.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate italic">
                      &quot;{topic.sampleQueries?.[0] || topic.topic}&quot;
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {topic.resolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Resolved
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveTopic(topic._id)}
                          disabled={resolvingId === topic._id}
                          className="text-[11px] h-7"
                        >
                          {resolvingId === topic._id ? 'Saving...' : 'Mark Resolved'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Content Gaps & Low-Grounding Watchlist */}
      {overview?.contentGaps && (
        <Card className="border-amber-200 bg-amber-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Content Gap Alert: Low Grounding / Negative Feedback Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-slate-600">
              The AI companion identified {overview.contentGaps.ungroundedResponsesCount || 0} recent inquiries where course source documents did not contain sufficient grounding.
            </p>
            <p className="text-xs text-slate-500">
              Consider uploading additional course source documentation or textbooks in the <strong>Course Studio</strong> to enhance AI Tutor grounding.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

