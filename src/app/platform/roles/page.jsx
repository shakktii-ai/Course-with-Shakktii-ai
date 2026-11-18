'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input, Label } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  Edit,
  Trash2,
  Lock,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { PERMISSIONS } from '@/constants';

export default function PlatformRolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const [roleName, setRoleName] = useState('');
  const [roleSlug, setRoleSlug] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const allAvailablePermissions = Object.values(PERMISSIONS);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const togglePermission = (perm) => {
    if (selectedPerms.includes(perm)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== perm));
    } else {
      setSelectedPerms([...selectedPerms, perm]);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch('/api/v1/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          slug: roleSlug,
          description: roleDesc,
          permissions: selectedPerms,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to create role');
        return;
      }

      setCreateModalOpen(false);
      setRoleName('');
      setRoleSlug('');
      setRoleDesc('');
      setSelectedPerms([]);
      fetchRoles();
    } catch {
      setErrorMsg('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/v1/roles/${selectedRole._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          description: roleDesc,
          permissions: selectedPerms,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to update role');
        return;
      }

      setEditModalOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch {
      setErrorMsg('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const res = await fetch(`/api/v1/roles/${selectedRole._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchRoles();
      }
    } finally {
      setDeleteModalOpen(false);
      setSelectedRole(null);
    }
  };

  const openEditModal = (r) => {
    setSelectedRole(r);
    setRoleName(r.name);
    setRoleSlug(r.slug);
    setRoleDesc(r.description || '');
    setSelectedPerms(r.permissions || []);
    setErrorMsg(null);
    setEditModalOpen(true);
  };

  const openDeleteModal = (r) => {
    setSelectedRole(r);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Role-Based Access Control</h1>
          <p className="text-sm text-slate-500 mt-1">Configure system and organization roles with granular functional permissions</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setRoleName('');
            setRoleSlug('');
            setRoleDesc('');
            setSelectedPerms([]);
            setErrorMsg(null);
            setCreateModalOpen(true);
          }}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Create Custom Role
        </Button>
      </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name & Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Permissions Granted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty colSpan={5} message="Loading roles..." />
              ) : roles.length === 0 ? (
                <TableEmpty colSpan={5} message="No roles found" />
              ) : (
                roles.map((r) => (
                  <TableRow key={r._id || r.slug}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{r.name}</span>
                          {r.isSystemRole && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-400" /> System Protected
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-slate-500 mt-0.5">{r.slug}</p>
                        {r.description && <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isPlatformRole ? 'purple' : 'slate'}>
                        {r.isPlatformRole ? 'Platform' : 'Organization'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-700">
                        {r.permissions?.length || 0} permissions
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isActive !== false ? 'emerald' : 'slate'} dot>
                        {r.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {r.isSystemRole ? (
                        <span className="text-xs text-slate-400 italic">Immutable</span>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(r)}
                            leftIcon={<Edit className="w-3.5 h-3.5" />}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(r)}
                            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                            className="text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      {/* Create Custom Role Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Custom Role"
        description="Define a new role and select authorized capabilities"
        maxWidth="max-w-2xl"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="r-name" required>Role Name</Label>
              <Input
                id="r-name"
                required
                placeholder="Content Evaluator"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="r-slug" required>Role Slug</Label>
              <Input
                id="r-slug"
                required
                placeholder="CONTENT_EVALUATOR"
                value={roleSlug}
                onChange={(e) => setRoleSlug(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="r-desc">Description</Label>
            <Input
              id="r-desc"
              placeholder="Responsibilities and access scope..."
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
            />
          </div>

          <div>
            <Label>Assign Permissions ({selectedPerms.length} selected)</Label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2 bg-slate-50/50">
              {allAvailablePermissions.map((perm) => (
                <label
                  key={perm}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 rounded hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-mono text-[11px] truncate">{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Create Role
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Role Permissions"
        description="Update permissions assigned to this role"
        maxWidth="max-w-2xl"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <Label htmlFor="edit-r-name" required>Role Name</Label>
            <Input
              id="edit-r-name"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-r-desc">Description</Label>
            <Input
              id="edit-r-desc"
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
            />
          </div>

          <div>
            <Label>Permissions Checklist ({selectedPerms.length} assigned)</Label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2 bg-slate-50/50">
              {allAvailablePermissions.map((perm) => (
                <label
                  key={perm}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 rounded hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-mono text-[11px] truncate">{perm}</span>
                </label>
              ))}
            </div>
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
        title="Delete Custom Role"
        description="Are you sure you want to permanently delete this role? This cannot be undone."
      >
        <p className="text-sm text-slate-700">
          Target Role: <strong className="text-slate-900">{selectedRole?.name} ({selectedRole?.slug})</strong>
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteRole}>
            Delete Role
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

