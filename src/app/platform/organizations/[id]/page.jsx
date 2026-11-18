'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Building2,
  Globe,
  Settings,
  Users,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Layers,
} from 'lucide-react';

export default function OrganizationDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch(`/api/v1/organizations/${id}`);
        const data = await res.json();
        if (data.success) {
          setOrg(data.data);
        } else {
          router.push('/platform/organizations');
        }
      } catch {
        router.push('/platform/organizations');
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, [id, router]);

  if (loading || !org) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/platform/organizations" className="text-slate-500 hover:text-slate-900 flex items-center gap-1.5 text-xs font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Organizations
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{org.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Tenant Slug: {org.slug} • Tenant ID: {org._id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/platform/organizations/${id}/settings`}>
            <Button variant="outline" size="sm" leftIcon={<Settings className="w-3.5 h-3.5" />}>
              Tenant Settings
            </Button>
          </Link>
        </div>
      </div>
        {/* Organization Header Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold border border-emerald-200 shadow-2xs">
              {org.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
                <Badge variant={org.status === 'ACTIVE' ? 'emerald' : 'rose'} dot>
                  {org.status}
                </Badge>
              </div>
              <p className="font-mono text-xs text-slate-500 mt-1">
                Tenant Slug: <span className="text-slate-800 font-semibold">{org.slug}</span>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Type: <strong>{org.type?.replace(/_/g, ' ')}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Onboarded: {new Date(org.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Contact & Headquarters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-800">{org.contact?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Phone:</span>
                <span className="font-medium text-slate-800">{org.contact?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Country:</span>
                <span className="font-medium text-slate-800">{org.contact?.country || 'India'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Website:</span>
                <span className="font-medium text-slate-800">{org.website || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Data Isolation & Guardrails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Database Partition:</span>
                <span className="font-semibold text-emerald-700">Strict Tenant Scoped (tenantId)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Storage Boundary:</span>
                <span className="font-mono text-slate-700">/tenants/{org.slug}/</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Subscription Tier:</span>
                <span className="font-medium text-slate-800">{org.subscriptionTier || 'STARTER'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

