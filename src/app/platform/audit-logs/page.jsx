'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  FileText,
  Filter,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export default function PlatformAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: '15' });
      if (actionFilter !== 'ALL') query.append('action', actionFilter);
      if (statusFilter !== 'ALL') query.append('status', statusFilter);

      const res = await fetch(`/api/v1/audit-logs?${query.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.data || []);
        setTotalPages(data.meta?.pagination?.totalPages || 1);
        setTotalCount(data.meta?.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const openInspector = (log) => {
    setSelectedLog(log);
    setInspectModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-evident log of authentication, credential changes, and system modifications
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
          {totalCount} Total Events
        </span>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="FAILED_LOGIN">FAILED_LOGIN</option>
            <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
            <option value="PASSWORD_RESET_REQUESTED">PASSWORD_RESET_REQUESTED</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="USER_DELETED">USER_DELETED</option>
            <option value="ROLE_CREATED">ROLE_CREATED</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
            <option value="SESSION_REVOKED">SESSION_REVOKED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            {['ALL', 'SUCCESS', 'FAILURE', 'WARNING'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md font-medium transition-all ${statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Action</TableHead>
              <TableHead>Actor / Email</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableEmpty colSpan={7} message="Loading audit trail..." />
            ) : logs.length === 0 ? (
              <TableEmpty colSpan={7} message="No audit records found matching criteria" />
            ) : (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-800">
                    {log.action}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <div>
                      <span>{log.userEmail || 'System Process'}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{log.userType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{log.resourceType}</span>
                    {log.resourceId && (
                      <span className="block font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                        {log.resourceId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {log.ipAddress || '127.0.0.1'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.status === 'SUCCESS' ? 'emerald' : log.status === 'FAILURE' ? 'rose' : 'amber'}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInspector(log)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      className="text-xs text-slate-600 hover:bg-slate-100"
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Inspector Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Audit Event Inspection"
        description={`Event ID: ${selectedLog?._id}`}
        maxWidth="max-w-2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">Action</span>
                <strong className="text-slate-900 font-mono text-sm">{selectedLog.action}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <Badge variant={selectedLog.status === 'SUCCESS' ? 'emerald' : 'rose'}>
                  {selectedLog.status}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block">Actor</span>
                <span className="text-slate-800 font-medium">{selectedLog.userEmail || 'System'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">IP Address</span>
                <span className="font-mono text-slate-800">{selectedLog.ipAddress}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Resource Type</span>
                <span className="text-slate-800 font-medium">{selectedLog.resourceType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Resource ID</span>
                <span className="font-mono text-slate-800">{selectedLog.resourceId || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-600 font-semibold block mb-1">Payload Details (JSON):</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div>
              <span className="text-slate-400 block">User Agent:</span>
              <p className="font-mono text-[11px] text-slate-600 bg-slate-100 p-2 rounded break-all">
                {selectedLog.userAgent}
              </p>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setInspectModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

