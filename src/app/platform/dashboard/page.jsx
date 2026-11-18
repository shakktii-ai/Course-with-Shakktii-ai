'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import {
  Users,
  Building2,
  DollarSign,
  Zap,
  HardDrive,
  LogOut,
  Camera,
  Layers,
  CheckCircle,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export default function PlatformDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMetrics, resTenants] = await Promise.all([
        fetch('/api/v1/platform/metrics'),
        fetch('/api/v1/platform/tenants?limit=10'),
      ]);

      const [dataMetrics, dataTenants] = await Promise.all([
        resMetrics.json(),
        resTenants.json(),
      ]);

      if (dataMetrics.success) setMetrics(dataMetrics.data);
      if (dataTenants.success) setTenants(dataTenants.data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionLoading(tenantId);
    try {
      const res = await fetch(`/api/v1/platform/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTenants((prev) =>
          prev.map((t) => (t._id === tenantId ? { ...t, status: newStatus } : t))
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerSnapshot = async () => {
    try {
      const res = await fetch('/api/v1/platform/snapshot', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSnapshotSuccess(true);
        setTimeout(() => setSnapshotSuccess(false), 4000);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Action Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Platform Operations & SaaS Health</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-tenant governance, revenue tracking, storage footprints, and resource quotas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerSnapshot}
              className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Camera className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              {snapshotSuccess ? 'Snapshot Captured!' : 'Snapshot Platform KPIs'}
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Global SaaS KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Estimated MRR</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ${(metrics?.estimatedMrr || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Active Tenants</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {metrics?.activeTenants || 0} / {metrics?.totalTenants || 0}
                </p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Total Users</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {(metrics?.totalUsers || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Total Courses</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {(metrics?.totalCourses || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                <Layers className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Global AI Tokens</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {(metrics?.totalTokensUsed || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Storage Footprint</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {Math.round(((metrics?.totalStorageBytes || 0) / (1024 * 1024)) * 10) / 10} MB
                </p>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
                <HardDrive className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Multi-Tenant Governance Table */}
        <Card>
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Organizations & Subscription Tiers
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time tenant status, quota limits, user population, and operational controls
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Organization Name</TableHead>
                  <TableHead className="text-xs">Slug</TableHead>
                  <TableHead className="text-xs text-center">Tier</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs text-center">Users</TableHead>
                  <TableHead className="text-xs text-center">Courses</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-400">
                      No organizations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {t.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {t.slug}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-50 border-slate-300 text-slate-700"
                        >
                          {t.subscription?.tier || 'STARTER'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-center text-slate-600 font-medium">
                        {t.metrics?.userCount || 0}
                      </TableCell>
                      <TableCell className="text-xs text-center text-slate-600 font-medium">
                        {t.metrics?.courseCount || 0}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(t._id, t.status)}
                          disabled={actionLoading === t._id}
                          className={`text-[11px] h-7 ${
                            t.status === 'ACTIVE'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {actionLoading === t._id
                            ? 'Updating...'
                            : t.status === 'ACTIVE'
                            ? 'Suspend'
                            : 'Reactivate'}
                        </Button>
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
