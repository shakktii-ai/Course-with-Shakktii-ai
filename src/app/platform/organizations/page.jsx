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
  Building2,
  PlusCircle,
  Search,
  Filter,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export default function PlatformOrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'CORPORATE',
    website: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: '20' });
      if (statusFilter !== 'ALL') query.append('status', statusFilter);

      const res = await fetch(`/api/v1/organizations?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load organizations', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const res = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          type: formData.type,
          website: formData.website || undefined,
          contact: {
            email: formData.contactEmail || undefined,
            phone: formData.contactPhone || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Failed to onboard organization');
        return;
      }

      setCreateModalOpen(false);
      setFormData({
        name: '',
        slug: '',
        type: 'CORPORATE',
        website: '',
        contactEmail: '',
        contactPhone: '',
      });
      fetchOrganizations();
    } catch {
      setFormError('Network error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleSuspend = async (org) => {
    const isSuspended = org.status === 'SUSPENDED';
    const endpoint = isSuspended ? 'reactivate' : 'suspend';

    try {
      const res = await fetch(`/api/v1/organizations/${org._id}/${endpoint}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchOrganizations();
      }
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  const filteredOrgs = organizations.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return o.name?.toLowerCase().includes(term) || o.slug?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization & Academy Tenants</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-tenant customer directory with strict data isolation and academy white-labeling</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Onboard Organization
        </Button>
      </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search organizations by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
              {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
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

        {/* Organizations Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization / Academy</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tenant Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty colSpan={6} message="Loading organizations..." />
              ) : filteredOrgs.length === 0 ? (
                <TableEmpty colSpan={6} message="No organizations found" />
              ) : (
                filteredOrgs.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm border border-emerald-200">
                          {org.name?.charAt(0).toUpperCase() || 'O'}
                        </div>
                        <div>
                          <Link
                            href={`/platform/organizations/${org._id}`}
                            className="font-semibold text-slate-900 hover:text-emerald-600 text-sm"
                          >
                            {org.name}
                          </Link>
                          <p className="text-xs text-slate-400">{org.contact?.email || 'No contact email'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                      {org.type?.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {org.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.status === 'ACTIVE' ? 'emerald' : 'rose'} dot>
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/platform/organizations/${org._id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Overview
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSuspend(org)}
                        className={`text-xs ${
                          org.status === 'ACTIVE'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {org.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      {/* Onboard Organization Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Onboard New Tenant Organization"
        description="Creates an organization entity, default white-labeled academy, and settings"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div>
            <Label htmlFor="org-name" required>Organization Name</Label>
            <Input
              id="org-name"
              required
              placeholder="Acme Global Learning"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({
                  ...formData,
                  name,
                  slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
                });
              }}
            />
          </div>

          <div>
            <Label htmlFor="org-slug" required>Tenant Identifier (Slug)</Label>
            <Input
              id="org-slug"
              required
              placeholder="acme-global"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
            <p className="text-[11px] text-slate-400 mt-1">Used for subdomains, tenant-isolated file paths, and routing.</p>
          </div>

          <div>
            <Label htmlFor="org-type">Organization Type</Label>
            <select
              id="org-type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900"
            >
              <option value="CORPORATE">Corporate Enterprise</option>
              <option value="EDUCATIONAL_INSTITUTION">Educational Institution</option>
              <option value="COLLEGE_UNIVERSITY">College or University</option>
              <option value="TRAINING_PROVIDER">Training Provider</option>
              <option value="ONLINE_ACADEMY">Online Academy</option>
              <option value="PROFESSIONAL_CERTIFIER">Professional Certification Body</option>
              <option value="INDIVIDUAL">Individual Instructor / Creator</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="org-email">Contact Email</Label>
              <Input
                id="org-email"
                type="email"
                placeholder="contact@acme.edu"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="org-phone">Contact Phone</Label>
              <Input
                id="org-phone"
                placeholder="+1 (555) 123-4567"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={formLoading}>
              Onboard Organization
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

