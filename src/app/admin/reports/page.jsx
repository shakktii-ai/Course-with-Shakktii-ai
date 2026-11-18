'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Clock,
  Play,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [scheduledReports, setScheduledReports] = useState([]);
  const [reportType, setReportType] = useState('LEARNER_PROGRESS');
  const [reportFormat, setReportFormat] = useState('CSV');
  const [generating, setGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState(null);

  // New schedule form state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('WEEKLY');
  const [scheduleEmails, setScheduleEmails] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  const fetchScheduled = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/reports/scheduled');
      const data = await res.json();
      if (data.success) setScheduledReports(data.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  // Handle instant generation
  const handleGenerateInstant = async () => {
    setGenerating(true);
    setGeneratedOutput(null);
    try {
      const res = await fetch('/api/v1/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          format: reportFormat,
          title: `${reportType} Export`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedOutput(data.data);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Download raw file
  const handleDownloadFile = () => {
    if (!generatedOutput) return;
    const blob = new Blob([generatedOutput.content], {
      type: generatedOutput.format === 'CSV' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedOutput.title.toLowerCase().replace(/\s+/g, '_')}.${generatedOutput.format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Create scheduled report
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) return;

    setSchedulingLoading(true);
    try {
      const emails = scheduleEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      const res = await fetch('/api/v1/reports/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scheduleTitle.trim(),
          reportType,
          schedule: scheduleFrequency,
          format: reportFormat,
          recipients: emails,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setScheduledReports((prev) => [data.data, ...prev]);
        setShowScheduleModal(false);
        setScheduleTitle('');
        setScheduleEmails('');
      }
    } finally {
      setSchedulingLoading(false);
    }
  };

  // Execute scheduled report now
  const handleExecuteNow = async (reportId) => {
    try {
      const res = await fetch(`/api/v1/reports/scheduled/${reportId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGeneratedOutput(data.data.generatedReport);
        fetchScheduled();
      }
    } catch {
      // ignore
    }
  };

  // Delete scheduled report
  const handleDeleteSchedule = async (reportId) => {
    try {
      const res = await fetch(`/api/v1/reports/scheduled/${reportId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setScheduledReports((prev) => prev.filter((r) => r._id !== reportId));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Compliance & Enterprise Reports Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Export structured CSV/JSON audit reports and configure recurring automated delivery schedules
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowScheduleModal(true)}
          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Scheduled Report
        </Button>
      </div>

      {/* Instant Generation Form Card */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Instant Report Export Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Select Report Dataset
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="LEARNER_PROGRESS">Learner Progression & Completion</option>
                <option value="COURSE_COMPLETION">Course Benchmarks & Instructors</option>
                <option value="ASSESSMENT_RESULTS">Assessment Gradebook & Attempts</option>
                <option value="AI_USAGE">AI Studio & Tutor Token Usage Ledger</option>
                <option value="AUDIT_LOGS">Security & Governance Audit Trail</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Export File Format
              </label>
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="CSV">CSV (RFC 4180 / Excel Compatible)</option>
                <option value="JSON">JSON (Machine Readable)</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerateInstant}
                disabled={generating}
                className="w-full text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {generating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    Generate & Extract Report
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Generated Result Preview */}
          {generatedOutput && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Report Ready: {generatedOutput.title} ({generatedOutput.recordCount} rows,{' '}
                  {generatedOutput.fileSize} bytes)
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Generated on {new Date(generatedOutput.createdAt).toLocaleTimeString()}
                </p>
              </div>

              <Button size="sm" onClick={handleDownloadFile} className="text-xs bg-emerald-700 text-white">
                <Download className="h-3.5 w-3.5 mr-1" />
                Download {generatedOutput.format}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Reports List */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">
              Configured Automated Report Schedules
            </CardTitle>
            <p className="text-xs text-slate-500">
              Recurring automated exports delivered on daily, weekly, or monthly cadences
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchScheduled} className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Dataset</TableHead>
                <TableHead className="text-xs text-center">Frequency</TableHead>
                <TableHead className="text-xs text-center">Format</TableHead>
                <TableHead className="text-xs">Recipients</TableHead>
                <TableHead className="text-xs">Next Run</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-400">
                    No automated report schedules configured. Click &ldquo;New Scheduled Report&rdquo; to set one up.
                  </TableCell>
                </TableRow>
              ) : (
                scheduledReports.map((sch) => (
                  <TableRow key={sch._id}>
                    <TableCell className="text-xs font-semibold text-slate-800">
                      {sch.title}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {sch.reportType}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge variant="outline" className="text-[10px] bg-slate-50">
                        {sch.schedule}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center font-bold text-slate-700">
                      {sch.format}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {sch.recipients?.join(', ') || 'Admin Only'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {sch.nextRunAt ? new Date(sch.nextRunAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExecuteNow(sch._id)}
                        className="text-xs text-emerald-700 hover:bg-emerald-50 h-7"
                        title="Run Now"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(sch._id)}
                        className="text-xs text-rose-600 hover:bg-rose-50 h-7"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Schedule Configuration Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Configure Scheduled Report</h2>

            <form onSubmit={handleCreateSchedule} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Report Title
                </label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="e.g. Weekly Executive Progress Digest"
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Frequency
                </label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly (Recommended)</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Recipient Emails (comma-separated)
                </label>
                <input
                  type="text"
                  value={scheduleEmails}
                  onChange={(e) => setScheduleEmails(e.target.value)}
                  placeholder="dean@college.edu, director@org.io"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScheduleModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={schedulingLoading}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {schedulingLoading ? 'Saving...' : 'Save Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

