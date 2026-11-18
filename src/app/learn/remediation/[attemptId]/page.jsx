'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  BrainCircuit,
  ArrowLeft,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default function LearnerRemediationPage({ params }) {
  const unwrappedParams = use(params);
  const attemptId = unwrappedParams.attemptId;

  const [remediationData, setRemediationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPractice, setGeneratingPractice] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedExplanations, setRevealedExplanations] = useState({});

  const fetchRemediation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tutor/remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();
      if (data.success) {
        setRemediationData(data.data);
        setPracticeQuestions(data.data.remediationPlan?.practiceQuestions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchRemediation();
  }, [fetchRemediation]);

  const handleSelectAnswer = (qIndex, optIndex) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
    setRevealedExplanations((prev) => ({ ...prev, [qIndex]: true }));
  };

  const handleGenerateAdaptivePractice = async () => {
    if (!remediationData?.courseId || generatingPractice) return;
    setGeneratingPractice(true);
    try {
      const res = await fetch('/api/v1/tutor/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: remediationData.courseId }),
      });
      const data = await res.json();
      if (data.success && data.data.questions) {
        setPracticeQuestions(data.data.questions);
        setSelectedAnswers({});
        setRevealedExplanations({});
      }
    } finally {
      setGeneratingPractice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium">
          Diagnosing knowledge gaps & generating personalized AI remediation...
        </p>
      </div>
    );
  }

  const plan = remediationData?.remediationPlan;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/learn/dashboard"
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
          Targeted Remediation Session
        </Badge>
      </div>

      {/* Header Overview Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-emerald-600" />
                <h1 className="text-lg font-bold text-slate-900">Personalized Knowledge Remediation</h1>
              </div>
              <p className="text-xs text-slate-600">{plan?.overview || 'Reviewing concepts'}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-800">
                {remediationData?.scorePercentage || 0}%
              </span>
              <p className="text-[11px] text-slate-400">Attempt Score</p>
            </div>
          </div>

          {/* Weak concepts tags */}
          {plan?.weakConcepts && plan.weakConcepts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-700">Target Focus Areas:</span>
              {plan.weakConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-medium"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Misconception Analysis & Step-by-Step Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-800 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-amber-600" />
              Common Misconception Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 leading-relaxed">
              {plan?.misconceptionAnalysis ||
                'Ensure boundary conditions and server-side authorizations are strictly evaluated.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              Step-by-Step Mastery Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(plan?.stepByStepBreakdown || []).map((step, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Practice Flashcards */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-800">
              Diagnostic Practice Questions
            </CardTitle>
            <p className="text-xs text-slate-500">
              Reinforce understanding with targeted interactive practice
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAdaptivePractice}
            disabled={generatingPractice}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${generatingPractice ? 'animate-spin' : ''}`} />
            {generatingPractice ? 'Generating...' : 'Refresh Practice'}
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {practiceQuestions.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No practice questions available.
            </div>
          ) : (
            practiceQuestions.map((q, qIndex) => {
              const selectedOpt = selectedAnswers[qIndex];
              const isRevealed = revealedExplanations[qIndex];
              return (
                <div
                  key={qIndex}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-800">
                    {qIndex + 1}. {q.question}
                  </p>

                  <div className="space-y-1.5">
                    {q.options?.map((opt, optIndex) => {
                      const isSelected = selectedOpt === optIndex;
                      const isCorrect = optIndex === q.correctAnswerIndex;
                      let btnStyle = 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';

                      if (isRevealed) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                        } else if (isSelected) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                        }
                      }

                      return (
                        <button
                          key={optIndex}
                          type="button"
                          onClick={() => handleSelectAnswer(qIndex, optIndex)}
                          disabled={isRevealed}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isRevealed && isCorrect && (
                            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          )}
                          {isRevealed && isSelected && !isCorrect && (
                            <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isRevealed && (
                    <div className="mt-2 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

