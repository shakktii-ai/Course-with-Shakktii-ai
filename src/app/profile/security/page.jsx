'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  ArrowLeft,
  Key,
  Shield,
  Smartphone,
  Monitor,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export default function SecurityPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/v1/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);

    try {
      // Get current user ID
      const meRes = await fetch('/api/v1/auth/me');
      const meData = await meRes.json();
      if (!meData.success) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/v1/users/${meData.data._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPasswordStatus({ type: 'success', text: 'Password changed successfully. Other sessions terminated.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSessions();
      } else {
        setPasswordStatus({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch (err) {
      setPasswordStatus({ type: 'error', text: 'Network connection error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeSingle = async () => {
    if (!sessionToRevoke) return;

    try {
      const res = await fetch(`/api/v1/sessions/${sessionToRevoke}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s._id !== sessionToRevoke));
      }
    } finally {
      setSessionModalOpen(false);
      setSessionToRevoke(null);
    }
  };

  const handleRevokeAllOther = async () => {
    try {
      const res = await fetch('/api/v1/sessions', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
      }
    } catch (err) {
      console.error('Failed to revoke all sessions', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-800">Security & Sessions</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Active Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">Manage password credentials and device sign-ins</p>
        </div>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              Change Password
            </CardTitle>
            <CardDescription>
              Ensure your account is protected with a unique, high-entropy password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {passwordStatus && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs font-medium ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordStatus.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
              <div>
                <Label htmlFor="curr-pass" required>Current Password</Label>
                <Input
                  id="curr-pass"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="new-pass" required>New Password</Label>
                <Input
                  id="new-pass"
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="confirm-pass" required>Confirm New Password</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={passwordLoading}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-600" />
                Active Device Sessions
              </CardTitle>
              <CardDescription>
                Devices and browsers that are currently logged into your account
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllOther}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
              >
                Revoke All Other Sessions
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device / Browser</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableEmpty colSpan={5} message="No active sessions found" />
                ) : (
                  sessions.map((s, idx) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium text-slate-800 flex items-center gap-2.5">
                        {s.deviceInfo?.device === 'Mobile' ? (
                          <Smartphone className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Monitor className="w-4 h-4 text-slate-400" />
                        )}
                        <span>
                          {s.deviceInfo?.browser || 'Browser'} on {s.deviceInfo?.os || 'System'}
                        </span>
                        {idx === 0 && <Badge variant="emerald">Current Session</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {s.ipAddress || '127.0.0.1'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(s.lastActiveAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(s.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSessionToRevoke(s._id);
                            setSessionModalOpen(true);
                          }}
                          leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          className="text-xs text-rose-600 hover:bg-rose-50"
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title="Revoke Session"
        description="Are you sure you want to terminate this session? The device will be signed out immediately."
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setSessionModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRevokeSingle}>
            Revoke Session
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

