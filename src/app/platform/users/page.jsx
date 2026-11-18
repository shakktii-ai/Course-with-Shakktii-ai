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
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Lock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function PlatformUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter !== 'ALL') query.append('status', statusFilter);

      const res = await fetch(`/api/v1/users?${query.toString()}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.data || []);
        setTotalPages(data.meta?.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roles: [formData.role],
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Failed to create user');
        return;
      }

      setCreateModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'STUDENT', status: 'ACTIVE' });
      fetchUsers();
    } catch {
      setFormError('Network error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError(null);
    setFormLoading(true);

    try {
      const res = await fetch(`/api/v1/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          status: formData.status,
          roles: [formData.role],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Failed to update user');
        return;
      }

      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      setFormError('Network error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/v1/users/${selectedUser._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } finally {
      setDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.roles?.[0] || 'STUDENT',
      status: u.status || 'ACTIVE',
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const openDeleteModal = (u) => {
    setSelectedUser(u);
    setDeleteModalOpen(true);
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform accounts, roles, access status, and security permissions</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setFormData({ name: '', email: '', password: '', role: 'STUDENT', status: 'ACTIVE' });
            setFormError(null);
            setCreateModalOpen(true);
          }}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Add New User
        </Button>
      </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
              {['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Verified</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty colSpan={6} message="Loading users..." />
              ) : filteredUsers.length === 0 ? (
                <TableEmpty colSpan={6} message="No users matching your filters" />
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || ['STUDENT']).map((r) => (
                          <span key={r} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {r}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.status === 'ACTIVE' ? 'emerald' : u.status === 'SUSPENDED' ? 'rose' : 'slate'}
                        dot
                      >
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <XCircle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(u)}
                        leftIcon={<Edit className="w-3.5 h-3.5 text-slate-500" />}
                        className="text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(u)}
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

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New User"
        description="Add a new platform user or tenant member"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <Label htmlFor="create-name" required>Full Name</Label>
            <Input
              id="create-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="create-email" required>Email Address</Label>
            <Input
              id="create-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="create-password" required>Initial Password</Label>
            <Input
              id="create-password"
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="create-role">Role</Label>
              <select
                id="create-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="INSTRUCTOR">INSTRUCTOR</option>
                <option value="COURSE_CREATOR">COURSE_CREATOR</option>
                <option value="ORG_ADMIN">ORG_ADMIN</option>
                <option value="ORG_OWNER">ORG_OWNER</option>
              </select>
            </div>
            <div>
              <Label htmlFor="create-status">Status</Label>
              <select
                id="create-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={formLoading}>
              Create User
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User Details"
        description="Update profile details and role assignments"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {formError}
          </div>
        )}
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <Label htmlFor="edit-name" required>Full Name</Label>
            <Input
              id="edit-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email Address</Label>
            <Input id="edit-email" disabled value={formData.email} className="bg-slate-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="INSTRUCTOR">INSTRUCTOR</option>
                <option value="COURSE_CREATOR">COURSE_CREATOR</option>
                <option value="ORG_ADMIN">ORG_ADMIN</option>
                <option value="ORG_OWNER">ORG_OWNER</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={formLoading}>
              Save Updates
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm User Deletion"
        description="Are you sure you want to permanently delete this user? All user sessions and enrollments will be affected."
      >
        <p className="text-sm text-slate-700">
          Target User: <strong className="text-slate-900">{selectedUser?.name} ({selectedUser?.email})</strong>
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Permanently Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

