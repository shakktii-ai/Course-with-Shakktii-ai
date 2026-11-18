'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Award,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  QrCode,
  AlertCircle,
  CheckCircle,
  Search,
  RefreshCw,
  Trash2,
  ArrowLeft,
  XCircle,
} from 'lucide-react';

export default function CertificatesRegistryPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);

  // Issue modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [issueCourseId, setIssueCourseId] = useState('');
  const [issueUserId, setIssueUserId] = useState('');
  const [issueGrade, setIssueGrade] = useState(90);
  const [issuing, setIssuing] = useState(false);

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/certificates?limit=100');
      const data = await res.json();
      if (data.success && data.data) {
        setCertificates(data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load certificates', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // Load courses and users when issue modal opens
  const handleOpenIssueModal = async () => {
    setShowIssueModal(true);
    try {
      const [resC, resU] = await Promise.all([
        fetch('/api/v1/courses?limit=100'),
        fetch('/api/v1/users?limit=100'),
      ]);
      const [dataC, dataU] = await Promise.all([resC.json(), resU.json()]);
      if (dataC.success && dataC.data) {
        setCourses(dataC.data.items || []);
        if (dataC.data.items?.length > 0) setIssueCourseId(dataC.data.items[0]._id);
      }
      if (dataU.success && dataU.data) {
        setUsers(dataU.data.users || dataU.data.items || []);
        const uList = dataU.data.users || dataU.data.items || [];
        if (uList.length > 0) setIssueUserId(uList[0]._id);
      }
    } catch (err) {
      console.error('Failed to load form options', err);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueCourseId || !issueUserId) return;
    setIssuing(true);

    try {
      const res = await fetch('/api/v1/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: issueCourseId,
          userId: issueUserId,
          gradeScore: parseInt(issueGrade, 10) || 100,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowIssueModal(false);
        await fetchCertificates();
      }
    } finally {
      setIssuing(false);
    }
  };

  const handleRevokeSubmit = async () => {
    if (!revokeTarget) return;
    setRevoking(true);

    try {
      const res = await fetch(`/api/v1/certificates/${revokeTarget._id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revokeReason || 'Administrative revocation' }),
      });

      const data = await res.json();
      if (data.success) {
        setRevokeTarget(null);
        setRevokeReason('');
        await fetchCertificates();
      }
    } finally {
      setRevoking(false);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (c.recipientName || '').toLowerCase().includes(term) ||
      (c.certificateNumber || '').toLowerCase().includes(term) ||
      (c.courseTitle || '').toLowerCase().includes(term)
    );
  });

  const totalIssued = certificates.filter((c) => c.status === 'ISSUED').length;
  const totalRevoked = certificates.filter((c) => c.status === 'REVOKED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/assessments" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Assessments
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Certificates</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Certificate Registry</h1>
              <p className="text-sm text-slate-500">
                Issue, inspect, and manage cryptographically verifiable learner credentials
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchCertificates} className="gap-2 text-slate-700">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button onClick={handleOpenIssueModal} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <PlusCircle className="w-4 h-4" />
            Issue Certificate
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Credentials</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{certificates.length}</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active & Valid</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalIssued}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Revoked</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{totalRevoked}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search certificate or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading certificates...
        </div>
      ) : filteredCerts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No certificates found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Issue certificates when learners pass certification exams or complete course requirements.
          </p>
          <Button onClick={handleOpenIssueModal} className="bg-emerald-600 text-white text-xs gap-1.5">
            <PlusCircle className="w-4 h-4" />
            Issue First Certificate
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.map((cert) => (
                <tr key={cert._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {cert.recipientName}
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    {cert.courseTitle}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-600">
                    {cert.certificateNumber}
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant={cert.status === 'ISSUED' ? 'success' : 'danger'}>
                      {cert.status}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {new Date(cert.issueDate).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCert(cert)}
                        className="text-xs h-7 px-2 gap-1 text-slate-700"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        Details
                      </Button>

                      <Link href={`/verify/${cert.verificationCode}`} target="_blank">
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2 gap-1 text-blue-600">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Verify
                        </Button>
                      </Link>

                      {cert.status === 'ISSUED' && (
                        <button
                          onClick={() => setRevokeTarget(cert)}
                          className="p-1 hover:text-rose-600 text-slate-400 transition-colors"
                          title="Revoke Certificate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details & QR Code Modal */}
      {selectedCert && (
        <Modal
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
          title={`Certificate: ${selectedCert.certificateNumber}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-6 bg-slate-900 text-white rounded-xl text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10">
                <Award className="w-32 h-32" />
              </div>
              <p className="text-xs uppercase tracking-widest text-emerald-400 font-mono">
                AI Academy Official Credential
              </p>
              <h3 className="text-xl font-bold">{selectedCert.recipientName}</h3>
              <p className="text-xs text-slate-300">has successfully completed all requirements for</p>
              <h4 className="text-base font-semibold text-emerald-300">{selectedCert.courseTitle}</h4>
              <div className="pt-2 text-[11px] font-mono text-slate-400">
                Serial: {selectedCert.certificateNumber}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 font-mono text-slate-600">
              <p><span className="font-semibold text-slate-800">Verification URL:</span> {selectedCert.qrCodeData}</p>
              <p><span className="font-semibold text-slate-800">Cryptographic Token:</span> {selectedCert.verificationCode}</p>
              <p><span className="font-semibold text-slate-800">Status:</span> {selectedCert.status}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href={`/verify/${selectedCert.verificationCode}`} target="_blank">
                <Button size="sm" className="bg-emerald-600 text-white gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Public Verify Page
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <Modal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          title="Issue Verifiable Certificate"
          size="md"
        >
          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Course *
              </label>
              <select
                value={issueCourseId}
                onChange={(e) => setIssueCourseId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Learner *
              </label>
              <select
                value={issueUserId}
                onChange={(e) => setIssueUserId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.firstName || ''} {u.lastName || ''} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Grade Score (0 - 100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={issueGrade}
                onChange={(e) => setIssueGrade(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowIssueModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={issuing} className="bg-emerald-600 text-white">
                {issuing ? 'Issuing...' : 'Issue Certificate'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Revoke Modal */}
      {revokeTarget && (
        <Modal
          isOpen={!!revokeTarget}
          onClose={() => setRevokeTarget(null)}
          title="Revoke Certificate"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to revoke certificate <strong className="text-slate-900">{revokeTarget.certificateNumber}</strong>?
              This action will mark the public credential as invalid.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Revocation Reason
              </label>
              <textarea
                rows={2}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Academic integrity violation or administrative correction."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRevokeTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={revoking} onClick={handleRevokeSubmit}>
                {revoking ? 'Revoking...' : 'Confirm Revocation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

