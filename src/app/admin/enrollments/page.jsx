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
  UserCheck,
  PlusCircle,
  ArrowLeft,
  Search,
  Filter,
  Users,
  Building2,
  Trash2,
  Calendar,
  BookOpen,
} from 'lucide-react';

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Enroll Modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollTab, setEnrollTab] = useState('individual'); // 'individual' | 'department' | 'group'
  const [targetCourseId, setTargetCourseId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourseFilter) params.set('courseId', selectedCourseFilter);
      if (statusFilter) params.set('status', statusFilter);

      const [resEnr, resCrs, resUsr, resDept, resGrp] = await Promise.all([
        fetch(`/api/v1/enrollments?${params.toString()}`),
        fetch('/api/v1/courses'),
        fetch('/api/v1/users'),
        fetch('/api/v1/departments'),
        fetch('/api/v1/groups'),
      ]);

      const [dataEnr, dataCrs, dataUsr, dataDept, dataGrp] = await Promise.all([
        resEnr.json(),
        resCrs.json(),
        resUsr.json(),
        resDept.json(),
        resGrp.json(),
      ]);

      if (dataEnr.success) setEnrollments(dataEnr.data.items || []);
      if (dataCrs.success) setCourses(dataCrs.data.items || []);
      if (dataUsr.success) setUsers(dataUsr.data.users || dataUsr.data || []);
      if (dataDept.success) setDepartments(dataDept.data || []);
      if (dataGrp.success) setGroups(dataGrp.data || []);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseFilter, statusFilter]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!targetCourseId) {
      alert('Please select a course');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        courseId: targetCourseId,
        isMandatory,
        expiresAt: expiresAt || undefined,
      };

      if (enrollTab === 'individual') {
        if (!targetUserId) {
          alert('Please select a learner');
          setSaving(false);
          return;
        }
        payload.userId = targetUserId;
        payload.enrollmentType = 'INDIVIDUAL';
      } else if (enrollTab === 'department') {
        if (!targetDeptId) {
          alert('Please select a department');
          setSaving(false);
          return;
        }
        payload.departmentId = targetDeptId;
        payload.enrollmentType = 'DEPARTMENT';
      } else if (enrollTab === 'group') {
        if (!targetGroupId) {
          alert('Please select a cohort group');
          setSaving(false);
          return;
        }
        payload.groupId = targetGroupId;
        payload.enrollmentType = 'GROUP';
      }

      const res = await fetch('/api/v1/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setEnrollModalOpen(false);
        setTargetUserId('');
        setTargetDeptId('');
        setTargetGroupId('');
        fetchEnrollments();
      } else {
        alert(data.error?.message || 'Failed to process enrollment');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = async (enrollmentId) => {
    if (!confirm('Cancel / drop this learner from the course?')) return;
    try {
      const res = await fetch(`/api/v1/enrollments/${enrollmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchEnrollments();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="info">Completed</Badge>;
      case 'EXPIRED':
        return <Badge variant="warning">Expired</Badge>;
      case 'DROPPED':
        return <Badge variant="neutral">Dropped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-600" />
            Course Enrollment Engine
          </h1>
          <p className="text-sm text-slate-500">
            Assign individual learners, entire departments, or cohorts with completion deadlines.
          </p>
        </div>
        <div>
          <Button onClick={() => setEnrollModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Enroll Learners
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Enrollment Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="EXPIRED">Expired</option>
                <option value="DROPPED">Dropped</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollments Registry ({enrollments.length})</CardTitle>
          <CardDescription>All active, completed, and assigned course records.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Enrolled On</TableHead>
                <TableHead>Deadline / Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    Loading enrollments...
                  </TableCell>
                </TableRow>
              ) : enrollments.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  title="No enrollments found"
                  description="Assign courses to learners, departments, or cohorts."
                  action={
                    <Button size="sm" onClick={() => setEnrollModalOpen(true)}>
                      <PlusCircle className="w-4 h-4 mr-1" /> Enroll Learners
                    </Button>
                  }
                />
              ) : (
                enrollments.map((enr) => (
                  <TableRow key={enr._id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{enr.userId?.name || 'Learner'}</div>
                        <div className="text-xs text-slate-400">{enr.userId?.email || '—'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800 text-sm">
                        {enr.courseId?.title || 'Course'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {enr.enrollmentType}
                        {enr.isMandatory ? ' • Mandatory' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(enr.enrolledAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {enr.expiresAt ? new Date(enr.expiresAt).toLocaleDateString() : 'Lifetime Access'}
                    </TableCell>
                    <TableCell>{getStatusBadge(enr.status)}</TableCell>
                    <TableCell className="text-right">
                      {enr.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDrop(enr._id)}
                          title="Drop Enrollment"
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ENROLL MODAL */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Enroll in Course"
        description="Choose a course and assign learners individually or in bulk."
      >
        <form onSubmit={handleEnroll} className="space-y-4">
          <div>
            <Label required>Select Course</Label>
            <select
              value={targetCourseId}
              onChange={(e) => setTargetCourseId(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Choose a Course...</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* Scope Selector Tabs */}
          <div>
            <Label>Enrollment Scope</Label>
            <div className="flex border border-slate-200 rounded-md overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setEnrollTab('individual')}
                className={`flex-1 py-2 text-center transition-colors ${
                  enrollTab === 'individual'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Individual Learner
              </button>
              <button
                type="button"
                onClick={() => setEnrollTab('department')}
                className={`flex-1 py-2 text-center transition-colors ${
                  enrollTab === 'department'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Department
              </button>
              <button
                type="button"
                onClick={() => setEnrollTab('group')}
                className={`flex-1 py-2 text-center transition-colors ${
                  enrollTab === 'group'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cohort Group
              </button>
            </div>
          </div>

          {enrollTab === 'individual' && (
            <div>
              <Label required>Learner User</Label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a Learner...</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {enrollTab === 'department' && (
            <div>
              <Label required>Department</Label>
              <select
                value={targetDeptId}
                onChange={(e) => setTargetDeptId(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code || 'No Code'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {enrollTab === 'group' && (
            <div>
              <Label required>Cohort Group</Label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select Group...</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.members?.length || 0} members)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <Label>Access Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="mandCheck"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="mandCheck" className="text-xs text-slate-700 font-medium">
                Mandatory Training requirement
              </label>
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Confirm Enrollment
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

