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
  Users,
  BookOpen,
} from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, dRes] = await Promise.all([
        fetch('/api/v1/groups'),
        fetch('/api/v1/departments'),
      ]);
      const [gData, dData] = await Promise.all([gRes.json(), dRes.json()]);

      if (gData.success) setGroups(gData.data || []);
      if (dData.success) setDepartments(dData.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch('/api/v1/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          departmentId: departmentId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to create group');
        return;
      }

      setCreateModalOpen(false);
      setName('');
      setDescription('');
      setDepartmentId('');
      fetchData();
    } catch {
      setErrorMsg('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/v1/groups/${selectedGroup._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          departmentId: departmentId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to update group');
        return;
      }

      setEditModalOpen(false);
      setSelectedGroup(null);
      fetchData();
    } catch {
      setErrorMsg('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/v1/groups/${selectedGroup._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } finally {
      setDeleteModalOpen(false);
      setSelectedGroup(null);
    }
  };

  const openEdit = (g) => {
    setSelectedGroup(g);
    setName(g.name);
    setDescription(g.description || '');
    setDepartmentId(g.departmentId?._id || '');
    setErrorMsg(null);
    setEditModalOpen(true);
  };

  const openDelete = (g) => {
    setSelectedGroup(g);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learner Groups & Cohorts</h1>
          <p className="text-sm text-slate-500 mt-1">Group learners together to assign targeted courses and track collective progress</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setName('');
            setDescription('');
            setDepartmentId('');
            setErrorMsg(null);
            setCreateModalOpen(true);
          }}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Create Group
        </Button>
      </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Associated Department</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Assigned Courses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty colSpan={5} message="Loading groups..." />
              ) : groups.length === 0 ? (
                <TableEmpty colSpan={5} message="No learner groups created yet" />
              ) : (
                groups.map((g) => (
                  <TableRow key={g._id}>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-slate-900 text-sm">{g.name}</span>
                        {g.description && <p className="text-xs text-slate-400 mt-0.5">{g.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                      {g.departmentId?.name || <span className="text-slate-400">All Departments</span>}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {g.memberIds?.length || 0} learners
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {g.courseIds?.length || 0} courses
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(g)}
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDelete(g)}
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
        title="Create Learner Group"
        description="Organize learners into cohorts for curriculum assignment"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="g-name" required>Group Name</Label>
            <Input
              id="g-name"
              required
              placeholder="Q1 New Hires Cohort"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="g-dept">Department (Optional)</Label>
            <select
              id="g-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
            >
              <option value="">Cross-Departmental / All</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="g-desc">Description</Label>
            <Input
              id="g-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Create Group
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Learner Group"
        description="Update cohort details"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="eg-name" required>Group Name</Label>
            <Input
              id="eg-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="eg-dept">Department</Label>
            <select
              id="eg-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
            >
              <option value="">Cross-Departmental / All</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="eg-desc">Description</Label>
            <Input
              id="eg-desc"
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

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Group"
        description="Are you sure you want to delete this cohort? Learner accounts will remain intact."
      >
        <p className="text-sm text-slate-800">
          Target Group: <strong className="text-slate-900">{selectedGroup?.name}</strong>
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Group
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

