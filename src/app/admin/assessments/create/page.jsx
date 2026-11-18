'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  Sparkles,
  BookOpen,
  FileCheck,
  ArrowLeft,
  Sliders,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';

export default function CreateAssessmentPage() {
  const router = useRouter();

  const [mode, setMode] = useState('ai'); // 'ai' | 'manual'
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('QUIZ');
  const [passingScorePercentage, setPassingScorePercentage] = useState(75);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [questionCount, setQuestionCount] = useState(4);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const res = await fetch('/api/v1/courses?limit=100');
        const data = await res.json();
        if (data.success && data.data) {
          setCourses(data.data.items || []);
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setLessons([]);
      setSelectedLessonId('');
      return;
    }

    async function loadLessons() {
      try {
        const res = await fetch(`/api/v1/courses/${selectedCourseId}?full=true`);
        const data = await res.json();
        if (data.success && data.data?.modules) {
          const all = [];
          data.data.modules.forEach((mod) => {
            if (mod.lessons) mod.lessons.forEach((l) => all.push(l));
          });
          setLessons(all);
          if (all.length > 0) setSelectedLessonId(all[0]._id);
        }
      } catch (err) {
        console.error('Failed to load lessons', err);
      }
    }
    loadLessons();
  }, [selectedCourseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'ai') {
        if (!selectedLessonId) {
          setError('Please select a course and lesson for AI quiz generation.');
          setSubmitting(false);
          return;
        }

        const res = await fetch('/api/v1/assessments/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'lesson',
            lessonId: selectedLessonId,
            questionCount,
            passingScorePercentage,
            timeLimitMinutes,
            maxAttempts,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to generate assessment');
        }

        router.push(`/admin/assessments/${data.data.assessment._id}`);
      } else {
        if (!title.trim()) {
          setError('Assessment title is required.');
          setSubmitting(false);
          return;
        }

        const res = await fetch('/api/v1/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            type,
            courseId: selectedCourseId || null,
            lessonId: selectedLessonId || null,
            passingScorePercentage,
            timeLimitMinutes,
            maxAttempts,
            shuffleQuestions,
            shuffleOptions,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to create assessment');
        }

        router.push(`/admin/assessments/${data.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the assessment');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <Link href="/admin/assessments">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Assessment</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate an AI assessment from lesson materials or build custom evaluations manually.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Selector */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              1. Choose Creation Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('ai')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                  mode === 'ai'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${mode === 'ai' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">AI-Grounded Generator</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Extracts core concepts from course lessons and creates multiple choice, true/false, and code questions with explanations.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                  mode === 'manual'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${mode === 'manual' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Manual Assessment Builder</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Design custom quizzes or certification exams with tailored question banks, options, and grading rules.
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Content & Association */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              2. Course & Curriculum Linkage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Associated Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  disabled={loadingCourses}
                >
                  <option value="">-- Choose a course --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Associated Lesson {mode === 'ai' && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  disabled={!selectedCourseId || lessons.length === 0}
                >
                  <option value="">-- Choose a lesson --</option>
                  {lessons.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {mode === 'manual' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Assessment Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Final Certification Exam: Cloud Architecture"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the assessment scope and requirements."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Assessment Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="QUIZ">Quiz (Knowledge Check)</option>
                    <option value="EXAM">Exam (Graded Midterm/Final)</option>
                    <option value="CERTIFICATION">Certification Exam (Unlocks Verifiable Credential)</option>
                    <option value="PRACTICE">Practice Test (Unlimited Retakes)</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grading & Rules Configuration */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              3. Grading & Examination Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Passing Score ({passingScorePercentage}%)
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={passingScorePercentage}
                  onChange={(e) => setPassingScorePercentage(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 mt-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="0 = Untimed"
                />
                <span className="text-[11px] text-slate-400">0 = Unlimited time</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Max Attempts
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="0 = Unlimited"
                />
                <span className="text-[11px] text-slate-400">0 = Unlimited retakes</span>
              </div>
            </div>

            {mode === 'ai' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Target Question Count ({questionCount} questions)
                </label>
                <input
                  type="range"
                  min={3}
                  max={8}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/admin/assessments">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
          >
            {mode === 'ai' ? <Sparkles className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
            {submitting ? 'Generating...' : mode === 'ai' ? 'Generate AI Assessment' : 'Create & Add Questions'}
          </Button>
        </div>
      </form>
    </div>
  );
}

