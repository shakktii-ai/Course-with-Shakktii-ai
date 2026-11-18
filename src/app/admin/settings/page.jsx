'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ArrowLeft,
  Save,
  Shield,
  Sparkles,
  Video,
  Languages,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/constants';

export default function AcademySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const [enrollmentType, setEnrollmentType] = useState('INVITE_ONLY');
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(false);
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [aiFeaturesEnabled, setAiFeaturesEnabled] = useState(true);
  const [videoGenerationEnabled, setVideoGenerationEnabled] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/v1/academy');
        const data = await res.json();
        if (data.success && data.data?.settings) {
          const s = data.data.settings;
          setEnrollmentType(s.enrollmentType || 'INVITE_ONLY');
          setAllowSelfRegistration(Boolean(s.allowSelfRegistration));
          setEnforce2FA(Boolean(s.enforce2FA));
          setDefaultLanguage(s.defaultLanguage || 'en');
          setAiFeaturesEnabled(s.aiFeaturesEnabled !== false);
          setVideoGenerationEnabled(s.videoGenerationEnabled !== false);
        }
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/v1/academy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            enrollmentType,
            allowSelfRegistration,
            enforce2FA,
            defaultLanguage,
            aiFeaturesEnabled,
            videoGenerationEnabled,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Academy operational settings saved successfully' });
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to save settings' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network connection error' });
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academy Policy & Preferences</h1>
          <p className="text-sm text-slate-500 mt-1">Configure enrollment controls, language localization, and AI features</p>
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
          {/* Enrollment Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Access & Enrollment Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="enroll-type">Course Enrollment Policy</Label>
                <select
                  id="enroll-type"
                  value={enrollmentType}
                  onChange={(e) => setEnrollmentType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
                >
                  <option value="INVITE_ONLY">Invite Only (Administrators assign courses)</option>
                  <option value="OPEN">Open (All active organization members can self-enroll)</option>
                  <option value="APPROVAL_REQUIRED">Approval Required (Manager approval requested)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-sm font-medium text-slate-800 block">Allow Public Self-Registration</span>
                  <span className="text-xs text-slate-500">Learners can create an account using verified corporate email domains</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowSelfRegistration}
                  onChange={(e) => setAllowSelfRegistration(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>
            </CardContent>
          </Card>

          {/* Localization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Languages className="w-4 h-4 text-emerald-600" />
                Localization & Multilingual Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="lang-select">Default Platform & Content Language</Label>
                <select
                  id="lang-select"
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* AI & Video Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                AI Studio & Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-sm font-medium text-slate-800 block">AI Course Studio Generation</span>
                  <span className="text-xs text-slate-500">Allow course creators to convert PDF/DOCX files into cited curricula</span>
                </div>
                <input
                  type="checkbox"
                  checked={aiFeaturesEnabled}
                  onChange={(e) => setAiFeaturesEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-800 block">AI Video Studio & TTS Synthesis</span>
                  <span className="text-xs text-slate-500">Enable automated scene script generation and background rendering</span>
                </div>
                <input
                  type="checkbox"
                  checked={videoGenerationEnabled}
                  onChange={(e) => setVideoGenerationEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>

              <div className="pt-4">
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

