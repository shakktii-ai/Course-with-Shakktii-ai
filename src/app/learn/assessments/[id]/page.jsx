'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  RefreshCw,
  Award,
  Check,
  BookOpen,
} from 'lucide-react';

export default function LearnerAssessmentPlayerPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const assessmentId = params.id;

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedOptionIds, textAnswer, codeAnswer } }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState('');

  // Start attempt on mount
  const startAssessment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/assessments/${assessmentId}/start`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to start assessment attempt');
      }

      setAssessment(data.data.assessment);
      setQuestions(data.data.questions || []);
      setAttempt(data.data.attempt);

      // Initialize timer if timed
      if (data.data.assessment.timeLimitMinutes > 0) {
        setTimeLeft(data.data.assessment.timeLimitMinutes * 60);
      }
    } catch (err) {
      setError(err.message || 'Failed to start assessment');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    startAssessment();
  }, [startAssessment]);

  const handleSubmitAttempt = useCallback(async () => {
    if (!attempt) return;
    setSubmitting(true);
    try {
      const answersPayload = Object.values(answers);
      const res = await fetch(`/api/v1/assessments/attempts/${attempt._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersPayload }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit attempt');
      }

      setResult(data.data);
    } catch (err) {
      alert(err.message || 'Failed to evaluate attempt');
    } finally {
      setSubmitting(false);
    }
  }, [attempt, answers]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAttempt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, result, handleSubmitAttempt]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
        Preparing assessment environment...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white border border-slate-200 rounded-xl text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-semibold text-slate-900">Cannot Start Assessment</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <Link href="/learn/dashboard">
          <Button variant="outline" size="sm">
            Return to Learner Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // --- Results Screen ---
  if (result) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Card className="border-slate-200 overflow-hidden shadow-sm">
          <div
            className={`p-6 text-center text-white ${
              result.passed ? 'bg-emerald-600' : 'bg-slate-900'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3">
              {result.passed ? (
                <CheckCircle2 className="w-8 h-8 text-white" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold">
              {result.passed ? 'Assessment Passed!' : 'Assessment Incomplete'}
            </h2>
            <p className="text-xs text-white/80 mt-1">
              Passing threshold: {result.passingScorePercentage}%
            </p>
            <p className="text-4xl font-extrabold font-mono mt-3">
              {result.scorePercentage}%
            </p>
            <p className="text-xs text-white/70 mt-1">
              Earned {result.totalPointsEarned} of {result.totalPointsPossible} points
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* If certificate issued */}
            {result.certificate && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-lg">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 text-sm">Certificate Earned!</h4>
                    <p className="text-xs text-amber-700">Serial: {result.certificate.certificateNumber}</p>
                  </div>
                </div>
                <Link href="/learn/certificates">
                  <Button size="sm" className="bg-amber-600 text-white text-xs">
                    View Certificate
                  </Button>
                </Link>
              </div>
            )}

            {/* Answer breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 text-sm">Question Review & Feedback</h3>
              {(result.attempt?.answers || []).map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                    ans.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Question #{idx + 1}</span>
                    <Badge variant={ans.isCorrect ? 'success' : 'danger'}>
                      {ans.isCorrect ? `+${ans.pointsAwarded} pts (Correct)` : '0 pts (Incorrect)'}
                    </Badge>
                  </div>

                  {ans.textAnswer && (
                    <p className="text-slate-600"><span className="font-semibold text-slate-700">Your Answer:</span> {ans.textAnswer}</p>
                  )}
                  {ans.feedback && (
                    <p className="text-slate-500 italic"><span className="font-semibold text-slate-700 not-italic">Feedback:</span> {ans.feedback}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link href="/learn/dashboard">
                <Button variant="outline" size="sm">
                  Learner Dashboard
                </Button>
              </Link>
              <Button onClick={() => window.location.reload()} size="sm" className="bg-emerald-600 text-white">
                Retake Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Active Assessment Player ---
  const currentQ = questions[currentIdx];
  const currentAnswer = answers[currentQ?._id] || {};

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-900">{assessment.title}</h1>
          <p className="text-xs text-slate-500 font-mono">
            Question {currentIdx + 1} of {questions.length} • Passing: {assessment.passingScorePercentage}%
          </p>
        </div>

        {timeLeft !== null && (
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Question Stepper Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {questions.map((q, idx) => {
          const isAnswered = Boolean(
            answers[q._id]?.selectedOptionIds?.length > 0 ||
            answers[q._id]?.textAnswer?.length > 0 ||
            answers[q._id]?.codeAnswer?.length > 0
          );
          const isCurrent = currentIdx === idx;
          return (
            <button
              key={q._id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all shrink-0 ${
                isCurrent
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2'
                  : isAnswered
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Card */}
      {currentQ && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <Badge variant="secondary" className="text-[10px] font-mono uppercase">
                {currentQ.questionType}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {currentQ.points || 1} {currentQ.points === 1 ? 'Point' : 'Points'}
              </span>
            </div>

            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              {currentQ.prompt}
            </h3>

            {currentQ.codeSnippet && (
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono">
                <pre>{currentQ.codeSnippet}</pre>
              </div>
            )}

            {/* Multiple Choice / True-False / Multiple Select Options */}
            {(currentQ.questionType === 'MULTIPLE_CHOICE' ||
              currentQ.questionType === 'TRUE_FALSE' ||
              currentQ.questionType === 'MULTIPLE_SELECT') && (
              <div className="space-y-2.5">
                {currentQ.options?.map((opt) => {
                  const isSelected = (currentAnswer.selectedOptionIds || []).includes(opt.id);
                  const isMulti = currentQ.questionType === 'MULTIPLE_SELECT';
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ._id, opt.id, isMulti)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 ${
                          isMulti ? 'rounded' : 'rounded-full'
                        } border flex items-center justify-center ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="flex-1">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fill in the blank input */}
            {currentQ.questionType === 'FILL_BLANK' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={currentAnswer.textAnswer || ''}
                  onChange={(e) => handleTextAnswerChange(currentQ._id, e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {/* Code Challenge input */}
            {currentQ.questionType === 'CODE_CHALLENGE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Code Solution (JavaScript)
                </label>
                <textarea
                  rows={6}
                  value={currentAnswer.codeAnswer || ''}
                  onChange={(e) => handleCodeAnswerChange(currentQ._id, e.target.value)}
                  placeholder="// Implement your solution..."
                  className="w-full font-mono text-xs px-3.5 py-2.5 bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="gap-1.5 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentIdx < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="bg-slate-900 text-white gap-1.5 text-xs"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmitAttempt}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold"
                  >
                    {submitting ? 'Evaluating Answers...' : 'Submit Assessment'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
