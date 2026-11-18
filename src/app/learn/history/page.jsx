'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import {
  History,
  ArrowLeft,
  CheckCircle,
  Clock,
  PlayCircle,
  BookOpen,
} from 'lucide-react';

export default function LearningHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/learn/history');
      const data = await res.json();
      if (data.success) {
        setHistory(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/learn/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-7 h-7 text-emerald-600" />
          Learning Activity History
        </h1>
        <p className="text-sm text-slate-500">
          Timeline of completed lessons, video watch time, and course progress milestones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Stream ({history.length})</CardTitle>
          <CardDescription>Track completed milestones and time invested.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson Activity</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    Loading history...
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  title="No learning activity yet"
                  description="When you engage with lessons and mark them completed, your timeline appears here."
                  action={
                    <Link href="/learn/courses">
                      <Button size="sm">
                        <BookOpen className="w-4 h-4 mr-1" /> Browse Courses
                      </Button>
                    </Link>
                  }
                />
              ) : (
                history.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {item.isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900">
                          {item.lessonId?.title || 'Lesson'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 text-sm">
                      {item.courseId?.title || 'Course'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {Math.round((item.timeSpentSeconds || 0) / 60)} mins
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isCompleted ? 'success' : 'outline'}>
                        {item.isCompleted ? 'Completed' : 'In Progress'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {item.completedAt ? new Date(item.completedAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.courseId && item.lessonId && (
                        <Link href={`/learn/player/${item.courseId._id}/${item.lessonId._id}`}>
                          <Button size="sm" variant="ghost">
                            <PlayCircle className="w-4 h-4 text-emerald-600" />
                          </Button>
                        </Link>
                      )}
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

