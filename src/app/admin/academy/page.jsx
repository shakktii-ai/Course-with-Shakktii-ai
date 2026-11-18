'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  ArrowLeft,
  Save,
  Globe,
  Palette,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';

export default function AcademyBrandingPage() {
  const [academy, setAcademy] = useState(null);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [isPublic, setIsPublic] = useState(true);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');

  // Domain Modal
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainError, setDomainError] = useState(null);

  const fetchAcademyData = async () => {
    try {
      const res = await fetch('/api/v1/academy');
      const data = await res.json();
      if (data.success && data.data) {
        const ac = data.data.academy;
        setAcademy(ac);
        setName(ac.name || '');
        setTagline(ac.tagline || '');
        setDescription(ac.description || '');
        setPrimaryColor(ac.theme?.primaryColor || '#059669');
        setSecondaryColor(ac.theme?.secondaryColor || '#0f172a');
        setIsPublic(ac.isPublic !== false);
        setHeroTitle(ac.landingPage?.heroTitle || '');
        setHeroSubtitle(ac.landingPage?.heroSubtitle || '');
        setDomains(data.data.domains || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademyData();
  }, []);

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/v1/academy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          description,
          isPublic,
          theme: { primaryColor, secondaryColor },
          landingPage: { heroTitle, heroSubtitle },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Academy branding and theme updated successfully' });
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to update academy' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving branding' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    setDomainError(null);
    setDomainLoading(true);

    try {
      const res = await fetch('/api/v1/academy/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDomainError(data.message || 'Failed to register custom domain');
        return;
      }

      setDomainModalOpen(false);
      setNewDomain('');
      fetchAcademyData();
    } catch {
      setDomainError('Network error');
    } finally {
      setDomainLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">White-Label Academy Studio</h1>
          <p className="text-sm text-slate-500 mt-1">Configure academy identity, custom domains, color themes, and learner portals</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveBranding} className="space-y-6">
              {/* General Identity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Academy Identity</CardTitle>
                  <CardDescription>Primary learner-facing brand attributes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ac-name" required>Academy Name</Label>
                    <Input
                      id="ac-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ac-tagline">Tagline</Label>
                    <Input
                      id="ac-tagline"
                      placeholder="Empowering workforce intelligence with AI"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ac-desc">Description</Label>
                    <Input
                      id="ac-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Theme & Palette */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    Color Theme & Styling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="p-color">Primary Brand Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          id="p-color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="s-color">Secondary Neutral Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          id="s-color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0"
                        />
                        <Input
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Landing Page Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Portal Hero Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="h-title">Hero Headline</Label>
                    <Input
                      id="h-title"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="h-subtitle">Hero Subtitle</Label>
                    <Input
                      id="h-subtitle"
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                    />
                  </div>
                  <div className="pt-2">
                    <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
                      Save Academy Branding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Right Column: Domains & Live URL */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Web Addresses
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDomainModalOpen(true)}
                    className="text-xs text-emerald-600 hover:bg-emerald-50"
                  >
                    + Add Domain
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Standard Subdomain</span>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between font-mono text-slate-800">
                    <span>{academy?.subdomain}.aiacademy.com</span>
                    <Badge variant="emerald">Live</Badge>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Custom Domains</span>
                  {domains.length === 0 ? (
                    <p className="text-slate-400 italic">No custom domains configured yet.</p>
                  ) : (
                    domains.map((d) => (
                      <div key={d._id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 mb-2">
                        <div className="flex items-center justify-between font-medium text-slate-900">
                          <span>{d.domain}</span>
                          <Badge variant={d.status === 'VERIFIED' ? 'emerald' : 'amber'}>
                            {d.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          CNAME Target: {d.dnsRecords?.[0]?.value || 'aiacademy.com'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Portal Live Preview Box */}
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm">Live Theme Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="p-5 rounded-xl text-white shadow-sm space-y-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <p className="text-xs uppercase tracking-wider opacity-80">{name}</p>
                  <h4 className="font-bold text-base">{heroTitle || 'Welcome to our Academy'}</h4>
                  <p className="text-xs opacity-90">{heroSubtitle || 'Industry-leading curriculum'}</p>
                  <div className="pt-2">
                    <span className="inline-block px-3 py-1 bg-white text-slate-900 font-semibold rounded-md text-xs shadow-2xs">
                      Start Learning
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Add Custom Domain Modal */}
      <Modal
        isOpen={domainModalOpen}
        onClose={() => setDomainModalOpen(false)}
        title="Add Custom Domain"
        description="Connect your organization's domain name (e.g., academy.yourcompany.com)"
      >
        {domainError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
            {domainError}
          </div>
        )}
        <form onSubmit={handleAddDomain} className="space-y-4">
          <div>
            <Label htmlFor="domain-input" required>Domain Name</Label>
            <Input
              id="domain-input"
              required
              placeholder="academy.yourcompany.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDomainModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={domainLoading}>
              Configure Domain
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

