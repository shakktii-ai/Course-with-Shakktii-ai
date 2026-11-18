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
  ArrowLeft,
  Mail,
  Shield,
  Edit,
  Trash2,
  FolderTree,
  Send,
} from 'lucide-react';

export default function OrganizationMembersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STUDENT',
    password: '',
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        fetch('/api/v1/users?limit=50'),
        fetch('/api/v1/departments'),
      ]);
      const [uData, dData] = await Promise.all([uRes.json(), dRes.json()]);

      if (uData.success) setUsers(uData.data || []);
      if (dData.success) setDepartments(dData.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateMember = async (e) => {
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
          password: formData.password || 'Welcome123!',
          roles: [formData.role],
          status: 'ACTIVE',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Failed to add member');
        return;
      }

      setCreateModalOpen(false);
      setFormData({ name: '', email: '', role: 'STUDENT', password: '' });
      fetchMembers();
    } catch {
      setFormError('Network error');
    } finally {
      setFormLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Member Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Learners, instructors, course creators, and department leads</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/admin/invitations">
            <Button variant="outline" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
              Invite Learners
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Member
          </Button>
        </div>
      </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty colSpan={5} message="Loading members..." />
              ) : filteredUsers.length === 0 ? (
                <TableEmpty colSpan={5} message="No members enrolled yet" />
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {u.roles?.[0] || 'STUDENT'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'ACTIVE' ? 'emerald' : 'slate'} dot>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/users?edit=${u._id}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                          Edit Access
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      {/* Add Member Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Academy Member"
        description="Directly create an account for a learner or instructor"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div>
            <Label htmlFor="m-name" required>Full Name</Label>
            <Input
              id="m-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="m-email" required>Email Address</Label>
            <Input
              id="m-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="m-role">Role</Label>
            <select
              id="m-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
            >
              <option value="STUDENT">STUDENT (Learner)</option>
              <option value="INSTRUCTOR">INSTRUCTOR (Teacher)</option>
              <option value="COURSE_CREATOR">COURSE_CREATOR (AI Studio)</option>
              <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER</option>
              <option value="ACADEMY_MANAGER">ACADEMY_MANAGER</option>
            </select>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={formLoading}>
              Add Member
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

