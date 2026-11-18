'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Send,
  Upload,
  ArrowLeft,
  Mail,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function InvitationsPage() {
  const [departments, setDepartments] = useState([]);
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Single Invite state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [departmentId, setDepartmentId] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleStatus, setSingleStatus] = useState(null);
  const [lastInviteToken, setLastInviteToken] = useState(null);

  // Bulk Import state
  const [csvContent, setCsvContent] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSummary, setBulkSummary] = useState(null);
  const [bulkError, setBulkError] = useState(null);

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await fetch('/api/v1/departments');
        const data = await res.json();
        if (data.success) setDepartments(data.data || []);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    }
    loadDepts();
  }, []);

  const handleSendSingle = async (e) => {
    e.preventDefault();
    setSingleStatus(null);
    setLastInviteToken(null);
    setSingleLoading(true);

    try {
      const res = await fetch('/api/v1/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          roles: [role],
          departmentId: departmentId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSingleStatus({ type: 'error', text: data.message || 'Failed to issue invitation' });
        return;
      }

      setSingleStatus({ type: 'success', text: `Invitation issued to ${email}` });
      setLastInviteToken(data.data?.token);
      setEmail('');
    } catch {
      setSingleStatus({ type: 'error', text: 'Network connection error' });
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    setBulkError(null);
    setBulkSummary(null);
    setBulkLoading(true);

    try {
      const res = await fetch('/api/v1/users/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvContent }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setBulkError(data.message || 'Bulk import failed');
        return;
      }

      setBulkSummary(data.data);
    } catch {
      setBulkError('Network connection error');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Onboard Learners & Personnel</h1>
          <p className="text-sm text-slate-500 mt-1">Issue cryptographic invitations or bulk import employee rosters</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCsvContent('email,name,role,department\nalice@example.com,Alice Smith,STUDENT,ENG-TECH\nbob@example.com,Bob Jones,INSTRUCTOR,ENG-TECH');
              setBulkSummary(null);
              setBulkError(null);
              setBulkModalOpen(true);
            }}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Bulk Import (CSV)
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSingleStatus(null);
              setLastInviteToken(null);
              setSingleModalOpen(true);
            }}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Invite Individual
          </Button>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Individual Invite Option */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                Direct Email Invitation
              </CardTitle>
              <CardDescription>Send an onboarding invitation token to an individual learner or instructor</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Generates a secure cryptographic invitation token. Once accepted, the user is automatically assigned to your organization with the configured role.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs"
                onClick={() => setSingleModalOpen(true)}
              >
                Launch Invitation Form
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Import Option */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Roster CSV Bulk Import
              </CardTitle>
              <CardDescription>Onboard corporate departments and student classes in bulk</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Accepts standard comma-separated text containing email, full name, role, and optional department codes.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setBulkModalOpen(true)}
              >
                Open Bulk CSV Importer
              </Button>
            </CardContent>
          </Card>
        </div>

      {/* Single Invitation Modal */}
      <Modal
        isOpen={singleModalOpen}
        onClose={() => setSingleModalOpen(false)}
        title="Invite Member"
        description="Issue an invitation link with preset role and department assignment"
      >
        {singleStatus && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs font-medium border ${
              singleStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {singleStatus.text}
          </div>
        )}

        {lastInviteToken ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-400 font-semibold block mb-1">Generated Invitation Token:</span>
              <p className="font-mono text-[11px] text-slate-800 break-all">{lastInviteToken}</p>
            </div>
            <p className="text-xs text-slate-500">
              Share this token with the learner. They can accept the invitation to activate their account.
            </p>
            <ModalFooter>
              <Button variant="primary" onClick={() => setSingleModalOpen(false)}>
                Done
              </Button>
            </ModalFooter>
          </div>
        ) : (
          <form onSubmit={handleSendSingle} className="space-y-4">
            <div>
              <Label htmlFor="inv-email" required>Learner / Work Email</Label>
              <Input
                id="inv-email"
                type="email"
                required
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inv-role">Assigned Role</Label>
                <select
                  id="inv-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="INSTRUCTOR">INSTRUCTOR</option>
                  <option value="COURSE_CREATOR">COURSE_CREATOR</option>
                  <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER</option>
                  <option value="ACADEMY_MANAGER">ACADEMY_MANAGER</option>
                </select>
              </div>
              <div>
                <Label htmlFor="inv-dept">Department</Label>
                <select
                  id="inv-dept"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setSingleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={singleLoading}>
                Generate Invitation
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Bulk Import Users via CSV"
        description="Paste comma-separated user data including headers"
        maxWidth="max-w-2xl"
      >
        {bulkError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {bulkError}
          </div>
        )}

        {bulkSummary ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <span className="font-semibold">Import Complete:</span>
              <span><strong>{bulkSummary.created}</strong> created | <strong>{bulkSummary.skipped}</strong> skipped</span>
            </div>
            {bulkSummary.errors?.length > 0 && (
              <div className="max-h-40 overflow-y-auto text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg font-mono">
                {bulkSummary.errors.map((e, idx) => (
                  <p key={idx} className="text-rose-600">
                    Row {e.row} ({e.email}): {e.reason}
                  </p>
                ))}
              </div>
            )}
            <ModalFooter>
              <Button variant="primary" onClick={() => setBulkModalOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </div>
        ) : (
          <form onSubmit={handleBulkImport} className="space-y-4">
            <div>
              <Label htmlFor="csv-input" required>CSV Text</Label>
              <Textarea
                id="csv-input"
                rows={8}
                required
                className="font-mono text-xs"
                placeholder="email,name,role,department&#10;user1@company.com,Jane Doe,STUDENT,ENG&#10;user2@company.com,John Smith,INSTRUCTOR,ENG"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Required header: <code className="font-mono text-slate-700">email</code>. Optional: <code className="font-mono text-slate-700">name, role, department</code>
              </p>
            </div>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={bulkLoading}>
                Execute Import
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </div>
  );
}

