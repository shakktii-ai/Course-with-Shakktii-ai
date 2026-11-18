'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  BookOpen,
  Film,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mic,
  UserCheck,
  Palette,
  Layout,
  Layers,
  HelpCircle,
} from 'lucide-react';

export default function CreateVideoProjectPage() {
  const router = useRouter();

  // Mode: 'lesson' | 'prompt'
  const [mode, setMode] = useState('lesson');

  // Courses & Lessons list
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');

  // Prompt mode state
  const [promptTitle, setPromptTitle] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [targetScenes, setTargetScenes] = useState(4);

  // Settings
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [selectedTheme, setSelectedTheme] = useState('emerald');
  const [avatarEnabled, setAvatarEnabled] = useState(true);
  const [avatarPosition, setAvatarPosition] = useState('bottom-right');
  const [voiceId, setVoiceId] = useState('en-US-JennyNeural');
  const [speedRate, setSpeedRate] = useState(1.0);

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available courses
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

  // Fetch lessons when course changes
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
        if (data.success && data.data && data.data.modules) {
          const allLessons = [];
          data.data.modules.forEach((mod) => {
            if (mod.lessons) {
              mod.lessons.forEach((les) => allLessons.push(les));
            }
          });
          setLessons(allLessons);
          if (allLessons.length > 0) {
            setSelectedLessonId(allLessons[0]._id);
          }
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
      const themesMap = {
        emerald: {
          primaryColor: '#059669',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
          fontFamily: 'Inter',
          template: 'modern-enterprise',
        },
        slate: {
          primaryColor: '#3b82f6',
          backgroundColor: '#1e293b',
          textColor: '#f8fafc',
          fontFamily: 'Inter',
          template: 'slate-minimal',
        },
        indigo: {
          primaryColor: '#6366f1',
          backgroundColor: '#090d16',
          textColor: '#ffffff',
          fontFamily: 'Inter',
          template: 'indigo-tech',
        },
      };

      const payload = {
        mode,
        aspectRatio,
        resolution,
        theme: themesMap[selectedTheme],
        voiceConfig: {
          voiceId,
          provider: 'MOCK',
          speedRate,
          pitch: 1.0,
        },
        avatarConfig: {
          enabled: avatarEnabled,
          avatarId: 'prof-clara',
          style: 'professional',
          position: avatarPosition,
        },
      };

      if (mode === 'lesson') {
        if (!selectedLessonId) {
          setError('Please select a course and lesson to generate video from.');
          setSubmitting(false);
          return;
        }
        payload.lessonId = selectedLessonId;
      } else {
        if (!promptTitle.trim() || !promptDescription.trim()) {
          setError('Please provide a title and topic description for the custom video.');
          setSubmitting(false);
          return;
        }
        payload.title = promptTitle.trim();
        payload.prompt = promptDescription.trim();
        payload.targetScenes = targetScenes;
      }

      const res = await fetch('/api/v1/video/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate video script');
      }

      const projectId = data.data?.project?._id || data.data?._id;
      router.push(`/admin/video/${projectId}`);
    } catch (err) {
      setError(err.message || 'An error occurred while creating the video project');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Back button */}
      <div>
        <Link href="/admin/video">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Video Studio
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create New Video Project</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate an AI video script from course curriculum or compose one from a custom instructional prompt.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Mode Selector */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              1. Choose Creation Source
            </CardTitle>
            <CardDescription>Select whether to extract content directly from a lesson or generate from scratch.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('lesson')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                  mode === 'lesson'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${mode === 'lesson' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">From Lesson Curriculum</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Auto-synthesizes scenes, teleprompter notes, and slide visual cards from existing course lessons.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('prompt')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                  mode === 'prompt'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${mode === 'prompt' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">From Custom Prompt or Topic</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Input a custom topic, learning objectives, and target scene count to structure a new presentation.
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Content Details */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layout className="w-4 h-4 text-emerald-600" />
              2. Content Configuration
            </CardTitle>
            <CardDescription>Specify the source course lesson or provide instructional guidelines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'lesson' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Select Course
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
                    Select Lesson
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    disabled={!selectedCourseId || lessons.length === 0}
                  >
                    <option value="">-- Choose a lesson --</option>
                    {lessons.map((les) => (
                      <option key={les._id} value={les._id}>
                        {les.title} ({les.type || 'LESSON'})
                      </option>
                    ))}
                  </select>
                  {selectedCourseId && lessons.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">This course does not have any lessons yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Video Project Title
                  </label>
                  <input
                    type="text"
                    value={promptTitle}
                    onChange={(e) => setPromptTitle(e.target.value)}
                    placeholder="e.g. Introduction to Multi-Tenant Cloud Architecture"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Topic Description & Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={promptDescription}
                    onChange={(e) => setPromptDescription(e.target.value)}
                    placeholder="Explain the concepts of tenant isolation, database connection pooling, and secure API boundaries with code snippets."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Target Scene Count ({targetScenes} scenes)
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    value={targetScenes}
                    onChange={(e) => setTargetScenes(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>2 Scenes (Quick intro)</span>
                    <span>4 Scenes (Standard)</span>
                    <span>8 Scenes (Comprehensive)</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Format & Theme */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              3. Visual Styling & Aspect Ratio
            </CardTitle>
            <CardDescription>Select delivery dimensions and visual presentation theme.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '16:9', label: '16:9 Landscape' },
                    { id: '9:16', label: '9:16 Mobile' },
                    { id: '1:1', label: '1:1 Square' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                        aspectRatio === ratio.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'emerald', label: 'Emerald' },
                    { id: 'slate', label: 'Slate' },
                    { id: 'indigo', label: 'Indigo' },
                  ].map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setSelectedTheme(th.id)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                        selectedTheme === th.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Presenter & Voice */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-600" />
              4. Presenter Avatar & Neural Voice
            </CardTitle>
            <CardDescription>Configure the presenter avatar overlay and speech synthesis voice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Narration Voice
                </label>
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <optgroup label="English">
                    <option value="en-US-JennyNeural">Jenny (Natural English - Female)</option>
                    <option value="en-US-GuyNeural">Guy (Professional - Male)</option>
                    <option value="en-US-AriaNeural">Aria (Expressive - Female)</option>
                  </optgroup>
                  <optgroup label="Hindi">
                    <option value="hi-IN-SwaraNeural">Swara (Studio - Female)</option>
                    <option value="hi-IN-MadhurNeural">Madhur (Clear - Male)</option>
                  </optgroup>
                  <optgroup label="Marathi">
                    <option value="mr-IN-AarohiNeural">Aarohi (Authentic - Female)</option>
                    <option value="mr-IN-ManoharNeural">Manohar (Conversational - Male)</option>
                  </optgroup>
                  <optgroup label="Telugu (తెలుగు)">
                    <option value="te-IN-ShrutiNeural">Shruti (Fluent - Female)</option>
                    <option value="te-IN-MohanNeural">Mohan (Academic - Male)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Speech Rate ({speedRate}x)
                </label>
                <input
                  type="range"
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={speedRate}
                  onChange={(e) => setSpeedRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 mt-2"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0.8x (Slower)</span>
                  <span>1.0x (Standard)</span>
                  <span>1.4x (Fast)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="avatarToggle"
                  checked={avatarEnabled}
                  onChange={(e) => setAvatarEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <label htmlFor="avatarToggle" className="text-sm font-medium text-slate-800">
                  Include AI Presenter Avatar Overlay
                </label>
              </div>

              {avatarEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Position:</span>
                  <select
                    value={avatarPosition}
                    onChange={(e) => setAvatarPosition(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="left-split">Left Split</option>
                    <option value="full-screen">Full Screen</option>
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/admin/video">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
          >
            <Sparkles className="w-4 h-4" />
            {submitting ? 'Generating Script...' : 'Generate Video Script & Open Studio'}
          </Button>
        </div>
      </form>
    </div>
  );
}

