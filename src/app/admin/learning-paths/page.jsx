'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input, Label } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Route,
  PlusCircle,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  BookOpen,
} from 'lucide-react';

export default function LearningPathsPage() {
  const [paths, setPaths] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('10');
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchPaths = useCallback(async () => {
    setLoading(true);
    try {
      const [resPaths, resCourses] = await Promise.all([
        fetch('/api/v1/learning-paths'),
        fetch('/api/v1/courses'),
      ]);

      const [dataPaths, dataCourses] = await Promise.all([
        resPaths.json(),
        resCourses.json(),
      ]);

      if (dataPaths.success) setPaths(dataPaths.data || []);
      if (dataCourses.success) setCourses(dataCourses.data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  const handleOpenCreate = () => {
    setSelectedPath(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setEstimatedHours('10');
    setSelectedCourseIds([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (path) => {
    setSelectedPath(path);
    setTitle(path.title);
    setSlug(path.slug);
    setDescription(path.description || '');
    setEstimatedHours(String(path.estimatedHours || 10));
    setSelectedCourseIds(path.courses?.map((c) => c.courseId?._id || c.courseId) || []);
    setModalOpen(true);
  };

  const toggleCourse = (courseId) => {
    if (selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    } else {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const url = selectedPath ? `/api/v1/learning-paths/${selectedPath._id}` : '/api/v1/learning-paths';
      const method = selectedPath ? 'PATCH' : 'POST';

      const coursesPayload = selectedCourseIds.map((cId, idx) => ({
        courseId: cId,
        order: idx,
        isRequired: true,
      }));

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          estimatedHours: parseFloat(estimatedHours) || 0,
          courses: coursesPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchPaths();
      } else {
        alert(data.error?.message || 'Failed to save learning path');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPath) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/learning-paths/${selectedPath._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setSelectedPath(null);
        fetchPaths();
      } else {
        alert(data.error?.message || 'Failed to delete');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/courses" className="text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Courses
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Route className="w-7 h-7 text-emerald-600" />
            Learning Paths & Tracks
          </h1>
          <p className="text-sm text-slate-500">
            Combine sequenced courses into comprehensive career and role-based learning pathways.
          </p>
        </div>
        <div>
          <Button onClick={handleOpenCreate}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Learning Path
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Learning Paths ({paths.length})</CardTitle>
          <CardDescription>Curated sequences of courses guiding students through skill roadmaps.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path Title</TableHead>
                <TableHead>Courses Sequenced</TableHead>
                <TableHead>Estimated Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Loading learning paths...
                  </TableCell>
                </TableRow>
              ) : paths.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  title="No learning paths configured"
                  description="Group courses together into sequenced tracks like 'Junior to Senior Engineer'."
                  action={
                    <Button size="sm" onClick={handleOpenCreate}>
                      <PlusCircle className="w-4 h-4 mr-1" /> Create Learning Path
                    </Button>
                  }
                />
              ) : (
                paths.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{p.title}</div>
                        <div className="text-xs text-slate-500">{p.description || 'No description'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {p.courses?.length || 0} Courses
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {p.estimatedHours || 0}h
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'success' : 'neutral'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}>
                          <Edit className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPath(p);
                            setDeleteModalOpen(true);
                          }}
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

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedPath ? 'Edit Learning Path' : 'Create Learning Path'}
        description="Select and sequence courses for this milestone track."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label required>Title</Label>
            <Input
              placeholder="e.g. Enterprise Cloud & DevOps Specialist"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!selectedPath) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }
              }}
              required
            />
          </div>

          <div>
            <Label>Slug</Label>
            <Input
              placeholder="e.g. enterprise-cloud-devops"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              rows={3}
              placeholder="Path summary and career track details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <Label>Estimated Total Hours</Label>
            <Input
              type="number"
              min="1"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
          </div>

          <div>
            <Label>Select Courses in Sequence ({selectedCourseIds.length} Selected)</Label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-1">
              {courses.map((c) => {
                const isSelected = selectedCourseIds.includes(c._id);
                return (
                  <div
                    key={c._id}
                    onClick={() => toggleCourse(c._id)}
                    className={`p-2 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{c.title}</span>
                    <span>{isSelected ? '✓ Included' : '+ Add'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {selectedPath ? 'Update Path' : 'Create Path'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Learning Path"
        description="Are you sure you want to delete this learning path track?"
      >
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
          Path: <strong>{selectedPath?.title}</strong>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={saving}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

