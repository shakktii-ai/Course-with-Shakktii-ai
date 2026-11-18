'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export default function OrganizationSettingsPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch(`/api/v1/organizations/${id}`);
        const data = await res.json();
        if (data.success) {
          setOrg(data.data);
          setName(data.data.name || '');
          setWebsite(data.data.website || '');
          setContactEmail(data.data.contact?.email || '');
          setContactPhone(data.data.contact?.phone || '');
        }
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/v1/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          website,
          contact: { email: contactEmail, phone: contactPhone },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Organization settings updated successfully' });
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to update settings' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error updating settings' });
    } finally {
      setSaving(false);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/platform/organizations/${id}`} className="text-slate-500 hover:text-slate-900 flex items-center gap-1.5 text-xs font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Overview
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Configure company profile, contact details, and tenant preferences</p>
        </div>
      </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="s-name" required>Organization Name</Label>
                <Input
                  id="s-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="s-slug">Tenant Slug (Immutable)</Label>
                <Input id="s-slug" disabled value={org?.slug || ''} className="bg-slate-50 font-mono text-xs" />
                <p className="text-[11px] text-slate-400 mt-1">Tenant slugs cannot be changed to prevent broken API references.</p>
              </div>

              <div>
                <Label htmlFor="s-web">Corporate Website</Label>
                <Input
                  id="s-web"
                  placeholder="https://company.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="s-email">Contact Email</Label>
                  <Input
                    id="s-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="s-phone">Contact Phone</Label>
                  <Input
                    id="s-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
    </div>
  );
}

