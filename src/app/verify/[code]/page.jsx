'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ExternalLink,
  Building,
  Calendar,
  Hash,
  RefreshCw,
} from 'lucide-react';

export default function PublicVerifyCertificatePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const code = params.code;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const verify = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/certificates/verify/${code}`);
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error('Verification query failed', err);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    verify();
  }, [verify]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-sm">Cryptographically verifying credential authenticity...</p>
        </div>
      </div>
    );
  }

  const cert = data?.certificate;
  const isValid = data?.isValid;
  const status = data?.status;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8">
      {/* Top Navbar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-lg">AI Academy</span>
        </Link>

        <span className="text-xs text-slate-500 font-mono">
          Credential Verification Registry
        </span>
      </div>

      {/* Main Verification Card */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        {!data || status === 'NOT_FOUND' ? (
          <Card className="border-rose-200 shadow-sm text-center p-8 space-y-4 bg-white">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Certificate Not Found</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The verification code <span className="font-mono text-slate-800">{code}</span> does not match any certificate in our registry.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Return to Home
                </Button>
              </Link>
            </div>
          </Card>
        ) : status === 'REVOKED' ? (
          <Card className="border-rose-300 shadow-sm text-center p-8 space-y-4 bg-rose-50/40">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-rose-900">Certificate Revoked</h2>
            <p className="text-xs text-rose-700 max-w-sm mx-auto">
              This certificate was officially revoked by the issuing institution.
            </p>
            {cert?.revocationReason && (
              <div className="p-3 bg-white border border-rose-200 rounded-lg text-xs text-slate-700 font-mono">
                <span className="font-bold">Reason:</span> {cert.revocationReason}
              </div>
            )}
          </Card>
        ) : (
          <Card className="border-emerald-200 shadow-xl overflow-hidden bg-white">
            <div className="bg-emerald-600 text-white p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <Badge variant="success" className="bg-white text-emerald-900 font-mono text-xs">
                VERIFIED CREDENTIAL
              </Badge>
              <h1 className="text-2xl font-bold">Authentic Certificate</h1>
              <p className="text-xs text-emerald-100">
                Issued and verified by the official AI Academy Registry
              </p>
            </div>

            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-1">
                <p className="text-xs uppercase font-mono tracking-wider text-slate-400">Awarded To</p>
                <h2 className="text-2xl font-bold text-slate-900">{cert?.recipientName}</h2>
              </div>

              <div className="text-center space-y-1 pt-2 border-t border-slate-100">
                <p className="text-xs uppercase font-mono tracking-wider text-slate-400">For Mastery Of</p>
                <h3 className="text-lg font-semibold text-emerald-700">{cert?.courseTitle}</h3>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs font-mono text-slate-700">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Issuing Institution</p>
                  <p className="font-semibold">{cert?.issuingOrganization || 'AI Academy'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Issue Date</p>
                  <p>{new Date(cert?.issueDate).toLocaleDateString()}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Grade Score</p>
                  <p className="font-bold text-emerald-600">{cert?.gradeScore}%</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Certificate Serial</p>
                  <p className="text-slate-900">{cert?.certificateNumber}</p>
                </div>
              </div>

              {cert?.skillsLearned && cert.skillsLearned.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">Verified Skills & Competencies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.skillsLearned.map((skill, sIdx) => (
                      <Badge key={sIdx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        © {new Date().getFullYear()} AI Academy Learning SaaS Platform. All verification tokens are tamper-evident.
      </div>
    </div>
  );
}

