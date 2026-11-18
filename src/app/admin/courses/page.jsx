'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Archive,
  Clock,
  Users,
  Layers,
  ArrowLeft,
} from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);

      const [resCourses, resCats] = await Promise.all([
        fetch(`/api/v1/courses?${params.toString()}`),
        fetch('/api/v1/categories'),
      ]);

      const [dataCourses, dataCats] = await Promise.all([
        resCourses.json(),
        resCats.json(),
      ]);

      if (dataCourses.success) {
        setCourses(dataCourses.data.items || []);
      }
      if (dataCats.success) {
        setCategories(dataCats.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handlePublish = async (courseId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchCourses();
      } else {
        alert(data.error?.message || 'Failed to publish course');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (courseId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/archive`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchCourses();
      } else {
        alert(data.error?.message || 'Failed to archive course');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/courses/${selectedCourse._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setSelectedCourse(null);
        fetchCourses();
      } else {
        alert(data.error?.message || 'Failed to delete course');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral">Archived</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning">In Review</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            Course Catalog & Curriculum Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage course catalog, structure modular curriculums, and deploy learning content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/categories">
            <Button variant="outline">
              <Layers className="w-4 h-4 mr-2" />
              Categories
            </Button>
          </Link>
          <Link href="/admin/courses/create">
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Search by course title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Courses Directory ({courses.length})</CardTitle>
          <CardDescription>
            All courses available inside this organization academy.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    Loading courses...
                  </TableCell>
                </TableRow>
              ) : courses.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  title="No courses found"
                  description="Start by creating your first course or adjusting filter criteria."
                  action={
                    <Link href="/admin/courses/create">
                      <Button size="sm">
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Create Course
                      </Button>
                    </Link>
                  }
                />
              ) : (
                courses.map((course) => (
                  <TableRow key={course._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0">
                          {course.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{course.title}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{course.headline || 'No summary'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.categoryId ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: course.categoryId.color || '#059669' }}
                          />
                          {course.categoryId.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">General</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {course.difficulty}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {course.durationHours}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {course.enrollmentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/courses/${course._id}`}>
                          <Button variant="ghost" size="sm" title="View Course Overview">
                            <Eye className="w-4 h-4 text-slate-600" />
                          </Button>
                        </Link>
                        <Link href={`/admin/courses/${course._id}/edit`}>
                          <Button variant="ghost" size="sm" title="Curriculum Builder Studio">
                            <Edit className="w-4 h-4 text-emerald-600" />
                          </Button>
                        </Link>

                        {course.status !== 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handlePublish(course._id)}
                            title="Publish Course"
                          >
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}

                        {course.status === 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleArchive(course._id)}
                            title="Archive Course"
                          >
                            <Archive className="w-4 h-4 text-amber-600" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCourse(course);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Course Deletion"
        description="Are you sure you want to permanently delete this course and all associated curriculum modules, lessons, and content blocks? This action cannot be undone."
      >
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
          Course: <strong>{selectedCourse?.title}</strong>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={actionLoading}>
            Delete Course
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

