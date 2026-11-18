'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  BookOpen,
  Eye,
  RefreshCw,
  Search,
  ArrowLeft,
  Award,
} from 'lucide-react';

export default function GradebookPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPassed, setFilterPassed] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/assessments/attempts?limit=100');
      const data = await res.json();
      if (data.success && data.data) {
        setAttempts(data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load gradebook attempts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const filteredAttempts = attempts.filter((a) => {
    if (filterPassed === 'PASSED' && !a.passed) return false;
    if (filterPassed === 'FAILED' && a.passed) return false;
    if (search) {
      const studentName = `${a.userId?.firstName || ''} ${a.userId?.lastName || ''}`.toLowerCase();
      const title = (a.assessmentId?.title || '').toLowerCase();
      if (!studentName.includes(search.toLowerCase()) && !title.includes(search.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const totalPassed = attempts.filter((a) => a.passed).length;
  const passRate = attempts.length > 0 ? Math.round((totalPassed / attempts.length) * 100) : 0;

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
            <span className="text-slate-800 font-medium">Gradebook</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Instructor Gradebook</h1>
              <p className="text-sm text-slate-500">
                Track learner performance, attempt submissions, pass rates, and evaluation breakdowns
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAttempts} className="gap-2 text-slate-700">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Submissions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{attempts.length}</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Pass Rate</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{passRate}%</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Successful Passes</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalPassed}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {['ALL', 'PASSED', 'FAILED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterPassed(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterPassed === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Submissions' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student or quiz..."
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
          Loading gradebook...
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No attempts recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When learners take published quizzes and exams, their scores and itemized answers will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Learner</th>
                <th className="py-3 px-4">Assessment</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time Spent</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttempts.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">
                      {item.userId?.firstName || ''} {item.userId?.lastName || ''}
                    </p>
                    <p className="text-[11px] text-slate-400">{item.userId?.email}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{item.assessmentId?.title || 'Assessment'}</p>
                    <span className="text-[10px] uppercase font-mono text-slate-400">
                      {item.assessmentId?.type || 'QUIZ'} • Attempt #{item.attemptNumber}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {item.scorePercentage}%
                      </span>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${item.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${item.scorePercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant={item.passed ? 'success' : 'danger'}>
                      {item.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-600">
                    {Math.round((item.timeSpentSeconds || 0) / 60)}m {(item.timeSpentSeconds || 0) % 60}s
                  </td>

                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAttempt(item)}
                      className="text-xs gap-1 text-slate-600 hover:text-slate-900"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attempt Breakdown Modal */}
      {selectedAttempt && (
        <Modal
          isOpen={!!selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
          title={`Attempt Breakdown: ${selectedAttempt.userId?.firstName || ''} ${selectedAttempt.userId?.lastName || ''}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Final Score</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {selectedAttempt.scorePercentage}% ({selectedAttempt.totalPointsEarned} / {selectedAttempt.totalPointsPossible} pts)
                </p>
              </div>
              <Badge variant={selectedAttempt.passed ? 'success' : 'danger'} className="text-sm px-3 py-1">
                {selectedAttempt.passed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Itemized Answers</h4>
              {(selectedAttempt.answers || []).map((ans, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-white space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Question #{idx + 1}</span>
                    <Badge variant={ans.isCorrect ? 'success' : 'danger'} className="text-[10px]">
                      {ans.isCorrect ? `+${ans.pointsAwarded} pts (Correct)` : '0 pts (Incorrect)'}
                    </Badge>
                  </div>
                  {ans.textAnswer && (
                    <p className="text-slate-600"><span className="font-medium">Text Answer:</span> {ans.textAnswer}</p>
                  )}
                  {ans.codeAnswer && (
                    <div className="bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[11px]">
                      <pre>{ans.codeAnswer}</pre>
                    </div>
                  )}
                  {ans.feedback && (
                    <p className="text-[11px] text-slate-500 italic"><span className="font-semibold not-italic">Feedback:</span> {ans.feedback}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedAttempt(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

