'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Input, Label } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Layers,
  PlusCircle,
  ArrowLeft,
  Edit,
  Trash2,
  BookOpen,
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#059669');
  const [icon, setIcon] = useState('BookOpen');
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setSelectedCat(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor('#059669');
    setIcon('BookOpen');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setSelectedCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setColor(cat.color || '#059669');
    setIcon(cat.icon || 'BookOpen');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const url = selectedCat ? `/api/v1/categories/${selectedCat._id}` : '/api/v1/categories';
      const method = selectedCat ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          color,
          icon,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchCategories();
      } else {
        alert(data.error?.message || 'Failed to save category');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCat) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/categories/${selectedCat._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setSelectedCat(null);
        fetchCategories();
      } else {
        alert(data.error?.message || 'Failed to delete category');
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
            <Layers className="w-7 h-7 text-emerald-600" />
            Course Categories
          </h1>
          <p className="text-sm text-slate-500">
            Organize courses into structured learning taxonomy and catalog filters.
          </p>
        </div>
        <div>
          <Button onClick={handleOpenCreate}>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categories.length})</CardTitle>
          <CardDescription>
            Categories used for catalog taxonomy, navigation, and learner exploration.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  title="No categories configured"
                  description="Create categories such as Web Development, Data Science, or Leadership."
                  action={
                    <Button size="sm" onClick={handleOpenCreate}>
                      <PlusCircle className="w-4 h-4 mr-1" /> Add Category
                    </Button>
                  }
                />
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat._id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || '#059669' }}
                        />
                        <span className="font-semibold text-slate-900">{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{cat.slug}</TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {cat.description || '—'}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {cat.courseCount || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(cat)}>
                          <Edit className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCat(cat);
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
        title={selectedCat ? 'Edit Category' : 'Create Course Category'}
        description="Set category name, theme accent color, and discovery slug."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label required>Category Name</Label>
            <Input
              placeholder="e.g. Artificial Intelligence"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!selectedCat) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }
              }}
              required
            />
          </div>

          <div>
            <Label>Slug</Label>
            <Input
              placeholder="e.g. artificial-intelligence"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div>
            <Label>Accent Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="font-mono text-xs w-32"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              rows={3}
              placeholder="What subjects and domains fall under this category?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {selectedCat ? 'Update Category' : 'Create Category'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Category"
        description="Are you sure you want to delete this category? Associated courses will be reassigned to General."
      >
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
          Category: <strong>{selectedCat?.name}</strong>
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

