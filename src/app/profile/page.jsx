'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  User,
  Shield,
  Key,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        if (data.success && data.data) {
          setUser(data.data);
          setName(data.data.name || '');
          setPhone(data.data.phone || '');
        } else {
          router.push('/login');
        }
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => ({ ...prev, name, phone }));
        setStatusMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-sm">
                AI
              </span>
              AI Academy
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-medium text-slate-600">User Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile/security">
              <Button variant="outline" size="sm" leftIcon={<Key className="w-3.5 h-3.5" />}>
                Security & Sessions
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
              className="text-rose-600 hover:bg-rose-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* User Identity Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500/20 text-emerald-700 flex items-center justify-center text-xl font-bold">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <Badge variant={user.status === 'ACTIVE' ? 'emerald' : 'amber'} dot>
                  {user.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(user.roles || [user.role || 'STUDENT']).map((r) => (
                  <span key={r} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Tenant Scope: <strong className="text-slate-700">{user.tenantId ? String(user.tenantId) : 'Global / Individual'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Joined: {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact numbers</CardDescription>
              </CardHeader>
              <CardContent>
                {statusMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-xs font-medium ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {statusMessage.text}
                  </div>
                )}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="name" required>Display Name</Label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" disabled value={user.email} className="bg-slate-50 text-slate-500" />
                    <p className="text-[11px] text-slate-400 mt-1">Contact your organization administrator to modify email.</p>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="primary" isLoading={saving}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-600">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Email Verification
                  </span>
                  <Badge variant={user.isEmailVerified ? 'emerald' : 'amber'}>
                    {user.isEmailVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span>Last Active Session</span>
                  <span className="font-mono text-slate-700">Just now</span>
                </div>
                <div className="pt-2">
                  <Link href="/profile/security">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Sessions & Password
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

