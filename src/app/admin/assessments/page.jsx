'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  FileCheck,
  PlusCircle,
  Sparkles,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  HelpCircle,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  Check,
  GraduationCap,
} from 'lucide-react';

export default function AssessmentManagerPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/assessments?limit=100');
      const data = await res.json();
      if (data.success && data.data) {
        setAssessments(data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load assessments', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/v1/assessments/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAssessments((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (activeTab !== 'ALL' && a.type !== activeTab) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalQuizzes = assessments.filter((a) => a.type === 'QUIZ').length;
  const totalExams = assessments.filter((a) => a.type === 'EXAM' || a.type === 'CERTIFICATION').length;
  const publishedCount = assessments.filter((a) => a.status === 'PUBLISHED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <FileCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assessments & Quizzes</h1>
            <p className="text-sm text-slate-500">
              Interactive question banks, automated grading, exams, and verifiable credentials
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/gradebook">
            <Button variant="outline" size="sm" className="gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Gradebook
            </Button>
          </Link>
          <Link href="/admin/certificates">
            <Button variant="outline" size="sm" className="gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Certificates
            </Button>
          </Link>
          <Link href="/admin/assessments/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <PlusCircle className="w-4 h-4" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Assessments</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{assessments.length}</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Published & Active</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{publishedCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quizzes & Knowledge Checks</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalQuizzes}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Exams & Certifications</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{totalExams}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'QUIZ', 'EXAM', 'CERTIFICATION', 'PRACTICE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Assessments' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Assessments Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading assessments...
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <FileCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No assessments found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Create an assessment manually or generate one automatically using AI from lesson content.
          </p>
          <Link href="/admin/assessments/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <PlusCircle className="w-4 h-4" />
              Create Assessment
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((item) => (
            <Card key={item._id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <Badge
                    variant={
                      item.type === 'CERTIFICATION'
                        ? 'warning'
                        : item.type === 'EXAM'
                        ? 'danger'
                        : 'secondary'
                    }
                    className="text-[10px] uppercase font-mono"
                  >
                    {item.type}
                  </Badge>

                  <Badge variant={item.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                    {item.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 text-base line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {item.description || 'Interactive evaluation assessment.'}
                  </p>
                </div>

                {/* Metadata tags */}
                <div className="bg-slate-50 p-2.5 rounded-lg text-xs grid grid-cols-2 gap-2 text-slate-600 font-mono">
                  <span>Questions: {item.questionsCount || 0}</span>
                  <span>Pass Score: {item.passingScorePercentage}%</span>
                  <span>
                    Time: {item.timeLimitMinutes > 0 ? `${item.timeLimitMinutes}m` : 'Untimed'}
                  </span>
                  <span>
                    Attempts: {item.maxAttempts > 0 ? `${item.maxAttempts}` : 'Unlimited'}
                  </span>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/assessments/${item._id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Questions
                      </Button>
                    </Link>
                    <Link href={`/learn/assessments/${item._id}`} target="_blank">
                      <Button size="sm" variant="ghost" className="text-xs text-emerald-700 hover:text-emerald-800">
                        Take Quiz
                      </Button>
                    </Link>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(item)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Assessment"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.title}</strong>? All questions and question banks will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete Assessment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

