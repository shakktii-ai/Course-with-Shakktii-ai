'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Award,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Download,
  Share2,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

export default function LearnerCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/learn/certificates');
      const data = await res.json();
      if (data.success && data.data) {
        setCertificates(data.data || []);
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/learn/dashboard" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Learner Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Certificates</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Certificates</h1>
              <p className="text-sm text-slate-500">
                Your verifiable completion credentials and professional certifications
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchCertificates} className="gap-2 text-slate-700">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Certificates Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading your credentials...
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No certificates earned yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Complete courses and pass certification exams to earn cryptographically verifiable credentials.
          </p>
          <Link href="/learn/courses">
            <Button className="bg-emerald-600 text-white text-xs">
              Explore Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert._id} className="border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600" />
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                    <Award className="w-6 h-6" />
                  </div>
                  <Badge variant="success" className="text-[10px] font-mono">
                    VERIFIED
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">{cert.courseTitle}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Awarded to {cert.recipientName}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-mono text-slate-600 space-y-1">
                  <p className="flex justify-between">
                    <span>Grade Score:</span>
                    <span className="font-bold text-slate-900">{cert.gradeScore}%</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Issued:</span>
                    <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Serial: {cert.certificateNumber}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCert(cert)}
                    className="text-xs gap-1.5 text-slate-700"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    View Certificate
                  </Button>

                  <Link href={`/verify/${cert.verificationCode}`} target="_blank">
                    <Button size="sm" variant="ghost" className="text-xs text-blue-600 gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Verify
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Printable Certificate Modal */}
      {selectedCert && (
        <Modal
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
          title={`Certificate: ${selectedCert.certificateNumber}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Certificate Display Plaque */}
            <div className="p-8 md:p-12 border-8 border-double border-amber-600/30 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white text-center space-y-4 shadow-2xl relative select-none">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                <span>Certificate of Mastery</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
                {selectedCert.recipientName}
              </h2>

              <p className="text-xs text-slate-300 max-w-md mx-auto italic">
                has successfully completed all rigorous curriculum requirements and verified evaluation assessments for
              </p>

              <h3 className="text-lg md:text-xl font-bold text-amber-300">
                {selectedCert.courseTitle}
              </h3>

              <div className="pt-6 border-t border-slate-800 grid grid-cols-2 text-xs font-mono text-slate-400">
                <div className="text-left">
                  <p className="text-slate-200 font-semibold">AI Academy Credential Authority</p>
                  <p>Issue Date: {new Date(selectedCert.issueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-200 font-semibold">Verification Code</p>
                  <p className="truncate">{selectedCert.verificationCode}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link href={`/verify/${selectedCert.verificationCode}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Public Verification Link
                </Button>
              </Link>

              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

