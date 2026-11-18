'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import {
  FileText,
  ArrowLeft,
  PlayCircle,
  Trash2,
  BookOpen,
} from 'lucide-react';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/learn/notes');
      const data = await res.json();
      if (data.success) {
        setNotes(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (noteId) => {
    try {
      const res = await fetch(`/api/v1/learn/notes?noteId=${noteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Error deleting note:', err);
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
            <FileText className="w-7 h-7 text-emerald-600" />
            My Study Notes
          </h1>
          <p className="text-sm text-slate-500">
            Personal annotations, code snippets, and reflections recorded during your coursework.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notes ({notes.length})</CardTitle>
          <CardDescription>Organized chronologically by date recorded.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note Content</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Recorded On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    Loading study notes...
                  </TableCell>
                </TableRow>
              ) : notes.length === 0 ? (
                <TableEmpty
                  colSpan={4}
                  title="No notes recorded yet"
                  description="Use the Notes drawer inside any Course Player session to jot down insights."
                  action={
                    <Link href="/learn/courses">
                      <Button size="sm">
                        <BookOpen className="w-4 h-4 mr-1" /> Explore Courses
                      </Button>
                    </Link>
                  }
                />
              ) : (
                notes.map((n) => (
                  <TableRow key={n._id}>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{n.content}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-700">
                        {n.lessonId?.title || 'Lesson'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {n.courseId && n.lessonId && (
                          <Link href={`/learn/player/${n.courseId}/${n.lessonId._id || n.lessonId}`}>
                            <Button size="sm" variant="outline">
                              <PlayCircle className="w-4 h-4 mr-1" /> Review Lesson
                            </Button>
                          </Link>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(n._id)}
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

