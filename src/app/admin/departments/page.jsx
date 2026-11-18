'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Input, Label } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  FolderTree,
  PlusCircle,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
} from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch('/api/v1/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, description }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to create department');
        return;
      }

      setCreateModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      fetchDepartments();
    } catch {
      setErrorMsg('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedDept) return;
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/v1/departments/${selectedDept._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, description }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to update department');
        return;
      }

      setEditModalOpen(false);
      setSelectedDept(null);
      fetchDepartments();
    } catch {
      setErrorMsg('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDept) return;
    try {
      const res = await fetch(`/api/v1/departments/${selectedDept._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDepartments();
      }
    } finally {
      setDeleteModalOpen(false);
      setSelectedDept(null);
    }
  };

  const openEdit = (d) => {
    setSelectedDept(d);
    setName(d.name);
    setCode(d.code || '');
    setDescription(d.description || '');
    setErrorMsg(null);
    setEditModalOpen(true);
  };

  const openDelete = (d) => {
    setSelectedDept(d);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Departments</h1>
          <p className="text-sm text-slate-500 mt-1">Structure training programs across business units and faculties</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setName('');
            setCode('');
            setDescription('');
            setErrorMsg(null);
            setCreateModalOpen(true);
          }}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Create Department
        </Button>
      </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Members Enrolled</TableHead>
                <TableHead>Department Manager</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty colSpan={5} message="Loading departments..." />
              ) : departments.length === 0 ? (
                <TableEmpty colSpan={5} message="No departments created yet" />
              ) : (
                departments.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-slate-900 text-sm">{d.name}</span>
                        {d.description && <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      {d.code || '—'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {d.memberCount} members
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {d.managerId?.name || <span className="text-slate-400 italic">Unassigned</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(d)}
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDelete(d)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                        className="text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Department"
        description="Add a new organizational unit or academic department"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="d-name" required>Department Name</Label>
            <Input
              id="d-name"
              required
              placeholder="Engineering & Technology"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="d-code">Department Code</Label>
            <Input
              id="d-code"
              placeholder="ENG-TECH"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <Label htmlFor="d-desc">Description</Label>
            <Input
              id="d-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Create Department
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Department"
        description="Update department information"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="ed-name" required>Department Name</Label>
            <Input
              id="ed-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ed-code">Department Code</Label>
            <Input
              id="ed-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <Label htmlFor="ed-desc">Description</Label>
            <Input
              id="ed-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save Updates
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Department"
        description="Are you sure you want to delete this department? Members will be unassigned."
      >
        <p className="text-sm text-slate-800">
          Target Department: <strong className="text-slate-900">{selectedDept?.name}</strong>
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Department
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

