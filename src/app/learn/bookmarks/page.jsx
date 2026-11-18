'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import {
  Bookmark,
  ArrowLeft,
  PlayCircle,
  Trash2,
  Clock,
  BookOpen,
} from 'lucide-react';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/learn/bookmarks');
      const data = await res.json();
      if (data.success) {
        setBookmarks(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemove = async (lessonId) => {
    try {
      const res = await fetch(`/api/v1/learn/bookmarks?lessonId=${lessonId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBookmarks();
      }
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/learn/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-emerald-600 fill-emerald-600" />
            Bookmarked Lessons
          </h1>
          <p className="text-sm text-slate-500">
            Quick reference library for key lessons and topics saved during your learning.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Bookmarks ({bookmarks.length})</CardTitle>
          <CardDescription>Lessons you marked to revisit later.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Saved Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    Loading bookmarks...
                  </TableCell>
                </TableRow>
              ) : bookmarks.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  title="No bookmarks saved"
                  description="While inside the Course Player, click the Bookmark icon on any lesson to save it here."
                  action={
                    <Link href="/learn/courses">
                      <Button size="sm">
                        <BookOpen className="w-4 h-4 mr-1" /> Explore Courses
                      </Button>
                    </Link>
                  }
                />
              ) : (
                bookmarks.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {b.lessonId?.title || b.title || 'Lesson'}
                      </div>
                      {b.note && <div className="text-xs text-slate-500 italic mt-0.5">{b.note}</div>}
                    </TableCell>
                    <TableCell className="text-slate-700 text-sm">
                      {b.courseId?.title || 'Course'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {b.lessonId?.durationMinutes ? `${b.lessonId.durationMinutes}m` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.courseId && b.lessonId && (
                          <Link href={`/learn/player/${b.courseId._id}/${b.lessonId._id}`}>
                            <Button size="sm" variant="outline">
                              <PlayCircle className="w-4 h-4 mr-1" /> Open
                            </Button>
                          </Link>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(b.lessonId?._id || b.lessonId)}
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

