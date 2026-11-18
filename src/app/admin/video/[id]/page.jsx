'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Film,
  Play,
  MonitorPlay,
  PlusCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Sparkles,
  Layers,
  Save,
  CheckCircle,
  ExternalLink,
  Code,
  Sliders,
  Type,
  User,
  Volume2,
  RefreshCw,
  Share2,
  ArrowLeft,
} from 'lucide-react';

export default function VideoStudioTimelinePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingScene, setSavingScene] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderJob, setRenderJob] = useState(null);
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  // Embed modal state
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [embedding, setEmbedding] = useState(false);
  const [embedSuccess, setEmbedSuccess] = useState(false);

  // Inspector form state for the active scene
  const [sceneForm, setSceneForm] = useState({
    title: '',
    narrationText: '',
    visualType: 'SLIDE',
    headline: '',
    bullets: '',
    codeSnippet: '',
    teleprompterNotes: '',
    durationSeconds: 5,
  });

  const fetchProjectData = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/video/projects/${projectId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setProject(data.data.project);
        setScenes(data.data.scenes || []);
        if (data.data.scenes && data.data.scenes.length > 0) {
          const first = data.data.scenes[0];
          setSceneForm({
            title: first.title || '',
            narrationText: first.narrationText || '',
            visualType: first.visualType || 'SLIDE',
            headline: first.visualContent?.headline || '',
            bullets: (first.visualContent?.bullets || []).join('\n'),
            codeSnippet: first.visualContent?.codeSnippet || '',
            teleprompterNotes: first.teleprompterNotes || '',
            durationSeconds: first.durationSeconds || 5,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load video project', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Sync form state when active scene index changes
  const selectScene = (index) => {
    setActiveSceneIndex(index);
    const s = scenes[index];
    if (s) {
      setSceneForm({
        title: s.title || '',
        narrationText: s.narrationText || '',
        visualType: s.visualType || 'SLIDE',
        headline: s.visualContent?.headline || '',
        bullets: (s.visualContent?.bullets || []).join('\n'),
        codeSnippet: s.visualContent?.codeSnippet || '',
        teleprompterNotes: s.teleprompterNotes || '',
        durationSeconds: s.durationSeconds || 5,
      });
    }
  };

  const handleSaveActiveScene = async () => {
    const active = scenes[activeSceneIndex];
    if (!active) return;
    setSavingScene(true);

    try {
      const payload = {
        title: sceneForm.title,
        narrationText: sceneForm.narrationText,
        visualType: sceneForm.visualType,
        visualContent: {
          headline: sceneForm.headline,
          bullets: sceneForm.bullets.split('\n').filter((b) => b.trim().length > 0),
          codeSnippet: sceneForm.codeSnippet,
        },
        teleprompterNotes: sceneForm.teleprompterNotes,
      };

      const res = await fetch(`/api/v1/video/projects/${projectId}/scenes/${active._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        await fetchProjectData();
      }
    } finally {
      setSavingScene(false);
    }
  };

  const handleAddScene = async () => {
    try {
      const res = await fetch(`/api/v1/video/projects/${projectId}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Scene ${scenes.length + 1}`,
          narrationText: 'Enter speech narration text for this new scene.',
          visualType: 'SLIDE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProjectData();
        setActiveSceneIndex(scenes.length);
      }
    } catch (err) {
      console.error('Failed to add scene', err);
    }
  };

  const handleDeleteScene = async (sceneId, e) => {
    e.stopPropagation();
    if (scenes.length <= 1) {
      alert('A video project must contain at least one scene.');
      return;
    }
    if (!confirm('Are you sure you want to delete this scene?')) return;

    try {
      const res = await fetch(`/api/v1/video/projects/${projectId}/scenes/${sceneId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchProjectData();
        setActiveSceneIndex(0);
      }
    } catch (err) {
      console.error('Failed to delete scene', err);
    }
  };

  const handleMoveScene = async (index, direction, e) => {
    e.stopPropagation();
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;

    const newScenes = [...scenes];
    const [moved] = newScenes.splice(index, 1);
    newScenes.splice(targetIdx, 0, moved);

    const sceneIds = newScenes.map((s) => s._id);

    try {
      const res = await fetch(`/api/v1/video/projects/${projectId}/scenes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneIds }),
      });
      if (res.ok) {
        await fetchProjectData();
        setActiveSceneIndex(targetIdx);
      }
    } catch (err) {
      console.error('Failed to reorder scenes', err);
    }
  };

  // Trigger Rendering Pipeline
  const handleStartRender = async () => {
    setRendering(true);
    setShowRenderModal(true);

    try {
      const res = await fetch(`/api/v1/video/projects/${projectId}/render?sync=true`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setRenderJob(data.data.job);
        await fetchProjectData();
      }
    } catch (err) {
      console.error('Rendering failed', err);
    } finally {
      setRendering(false);
    }
  };

  // Open Embed in Lesson Modal
  const handleOpenEmbedModal = async () => {
    setShowEmbedModal(true);
    setEmbedSuccess(false);
    try {
      const res = await fetch('/api/v1/courses?limit=100');
      const data = await res.json();
      if (data.success && data.data) {
        setCourses(data.data.items || []);
        if (project.courseId) {
          setSelectedCourseId(project.courseId);
        } else if (data.data.items?.length > 0) {
          setSelectedCourseId(data.data.items[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    }
  };

  // Load lessons for chosen course in Embed Modal
  useEffect(() => {
    if (!selectedCourseId) return;
    async function loadLessons() {
      try {
        const res = await fetch(`/api/v1/courses/${selectedCourseId}?full=true`);
        const data = await res.json();
        if (data.success && data.data?.modules) {
          const list = [];
          data.data.modules.forEach((m) => {
            if (m.lessons) m.lessons.forEach((l) => list.push(l));
          });
          setLessons(list);
          if (project.lessonId && list.some((l) => l._id === project.lessonId)) {
            setSelectedLessonId(project.lessonId);
          } else if (list.length > 0) {
            setSelectedLessonId(list[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load course lessons', err);
      }
    }
    loadLessons();
  }, [selectedCourseId, project?.lessonId]);

  const handleEmbedSubmit = async () => {
    if (!selectedLessonId) return;
    setEmbedding(true);
    try {
      const res = await fetch(`/api/v1/video/projects/${projectId}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: selectedLessonId }),
      });
      const data = await res.json();
      if (data.success) {
        setEmbedSuccess(true);
        await fetchProjectData();
      }
    } finally {
      setEmbedding(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
        Loading Video Studio...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Video project not found.</p>
        <Link href="/admin/video">
          <Button variant="outline" className="mt-4">
            Back to Studio
          </Button>
        </Link>
      </div>
    );
  }

  const activeScene = scenes[activeSceneIndex] || scenes[0];
  const activeNarrationWords = (sceneForm.narrationText || '').trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.max(3, Math.round(activeNarrationWords / 2.3));

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/admin/video" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Video Studio
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Timeline Editor</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
            <Badge
              variant={
                project.status === 'READY'
                  ? 'success'
                  : project.status === 'RENDERING'
                  ? 'warning'
                  : 'secondary'
              }
            >
              {project.status}
            </Badge>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
              <Clock className="w-3 h-3" />
              {project.totalDurationSeconds || 0}s total
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {project.status === 'READY' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Preview Video
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEmbedModal}
                className="gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-50"
              >
                <Share2 className="w-3.5 h-3.5" />
                Embed in Lesson
              </Button>
            </>
          )}

          <Button
            size="sm"
            onClick={handleStartRender}
            disabled={rendering}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
          >
            <MonitorPlay className="w-4 h-4" />
            {rendering ? 'Rendering Pipeline...' : project.status === 'READY' ? 'Re-render Video' : 'Render Video'}
          </Button>
        </div>
      </div>

      {/* 3-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scene Timeline Cards (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Scene Timeline ({scenes.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddScene}
              className="text-xs h-7 px-2 gap-1 text-slate-700"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {scenes.map((scene, idx) => (
              <div
                key={scene._id}
                onClick={() => selectScene(idx)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  activeSceneIndex === idx
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Scene {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                      {scene.visualType}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {scene.durationSeconds || 5}s
                    </span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">
                  {scene.title || `Scene ${idx + 1}`}
                </p>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {scene.narrationText}
                </p>

                {/* Card footer controls */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => handleMoveScene(idx, -1, e)}
                      disabled={idx === 0}
                      className="p-1 hover:text-slate-800 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleMoveScene(idx, 1, e)}
                      disabled={idx === scenes.length - 1}
                      className="p-1 hover:text-slate-800 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDeleteScene(scene._id, e)}
                    className="p-1 hover:text-rose-600 transition-colors"
                    title="Delete Scene"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Live Visual Presentation Canvas (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-4 h-4 text-emerald-600" />
              Live Presentation Canvas
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Aspect: {project.aspectRatio || '16:9'} • Style: {sceneForm.visualType}
            </span>
          </div>

          {/* Visual Slide Simulation Box */}
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-slate-950 border border-slate-800 flex flex-col justify-between p-6 text-white select-none">
            {/* Slide Header */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono tracking-wider uppercase text-emerald-400 font-semibold">
                  AI Academy Masterclass
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                Scene {activeSceneIndex + 1} / {scenes.length}
              </span>
            </div>

            {/* Slide Body Content */}
            <div className="my-auto space-y-3 pr-24 z-10">
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white leading-snug">
                {sceneForm.headline || sceneForm.title || 'Introduction to System Architecture'}
              </h3>

              {sceneForm.visualType === 'CODE_DEMO' ? (
                <div className="bg-slate-900/90 rounded-lg p-3 text-xs font-mono text-emerald-300 border border-emerald-900/40 overflow-x-auto">
                  <pre className="text-[11px] leading-relaxed">
                    {sceneForm.codeSnippet || '// Enterprise Service Implementation\nexport async function runTask() {\n  return { success: true };\n}'}
                  </pre>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {(sceneForm.bullets || 'Foundational principles\nDefensive error recovery\nHigh concurrency performance')
                    .split('\n')
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((point, pIdx) => (
                      <li key={pIdx} className="flex items-center gap-2 text-xs text-slate-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Avatar Presenter Overlay Badge */}
            {project.avatarConfig?.enabled && (
              <div
                className={`absolute ${
                  project.avatarConfig?.position === 'left-split'
                    ? 'top-10 left-6'
                    : 'bottom-4 right-4'
                } z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-full px-3 py-1.5 shadow-xl`}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left pr-1">
                  <p className="text-[11px] font-bold text-slate-100 leading-tight">Clara (AI)</p>
                  <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-mono">Presenting</p>
                </div>
              </div>
            )}

            {/* Teleprompter Banner at bottom of canvas */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 z-10">
              <span className="flex items-center gap-1.5 truncate max-w-[80%]">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="italic truncate">{sceneForm.narrationText}</span>
              </span>
              <span className="font-mono text-emerald-400 shrink-0">~{estimatedSeconds}s</span>
            </div>
          </div>

          {/* Teleprompter Tips Card */}
          <Card className="border-slate-200 bg-slate-50/50">
            <CardContent className="p-3 text-xs space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Instructor & Teleprompter Notes
              </p>
              <p className="text-slate-600 italic">
                {sceneForm.teleprompterNotes || 'Deliver with clear articulation. Pause briefly between key technical terms.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Scene Inspector & Audio Parameters (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Scene Inspector
            </h2>
            <Button
              size="sm"
              onClick={handleSaveActiveScene}
              disabled={savingScene}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2.5 gap-1.5 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {savingScene ? 'Saving...' : 'Save Scene'}
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm space-y-4 p-4">
            {/* Scene Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Scene Title
              </label>
              <input
                type="text"
                value={sceneForm.title}
                onChange={(e) => setSceneForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Visual Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Visual Presentation Style
              </label>
              <select
                value={sceneForm.visualType}
                onChange={(e) => setSceneForm((prev) => ({ ...prev, visualType: e.target.value }))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="SLIDE">Slide Presentation (Headline & Bullets)</option>
                <option value="AVATAR_PRESENTATION">Avatar Spotlight (Presenter Emphasis)</option>
                <option value="CODE_DEMO">Code Walkthrough (Syntax Box)</option>
                <option value="TEXT_HIGHLIGHT">Concept Highlight (Big Typography)</option>
              </select>
            </div>

            {/* Narration Script */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Spoken Narration Script
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {activeNarrationWords} words • ~{estimatedSeconds}s
                </span>
              </div>
              <textarea
                rows={4}
                value={sceneForm.narrationText}
                onChange={(e) => setSceneForm((prev) => ({ ...prev, narrationText: e.target.value }))}
                placeholder="Write the voice script to be spoken in this scene..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Slide Headline */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Slide Headline
              </label>
              <input
                type="text"
                value={sceneForm.headline}
                onChange={(e) => setSceneForm((prev) => ({ ...prev, headline: e.target.value }))}
                placeholder="e.g. Core Architectural Concepts"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Conditional: Code Snippet OR Bullet Points */}
            {sceneForm.visualType === 'CODE_DEMO' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Code Snippet
                </label>
                <textarea
                  rows={4}
                  value={sceneForm.codeSnippet}
                  onChange={(e) => setSceneForm((prev) => ({ ...prev, codeSnippet: e.target.value }))}
                  className="w-full font-mono text-xs px-3 py-2 bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Bullet Points (One per line)
                </label>
                <textarea
                  rows={3}
                  value={sceneForm.bullets}
                  onChange={(e) => setSceneForm((prev) => ({ ...prev, bullets: e.target.value }))}
                  placeholder="Key point 1\nKey point 2\nKey point 3"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {/* Teleprompter Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Presenter Delivery Tips
              </label>
              <input
                type="text"
                value={sceneForm.teleprompterNotes}
                onChange={(e) => setSceneForm((prev) => ({ ...prev, teleprompterNotes: e.target.value }))}
                placeholder="e.g. Pause slightly when introducing the diagram."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Rendering Pipeline Modal */}
      {showRenderModal && (
        <Modal
          isOpen={showRenderModal}
          onClose={() => setShowRenderModal(false)}
          title="AI Video Rendering Pipeline"
          size="md"
        >
          <div className="space-y-4">
            <div className="text-center py-4 space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <MonitorPlay className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-semibold text-slate-900">
                {rendering ? 'Processing Media Pipeline' : 'Rendering Complete!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Synthesizing multi-scene voice narration, rendering typography cards, stitching media, and generating WebVTT subtitles.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Progress</span>
                <span>{rendering ? '85%' : '100%'}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: rendering ? '85%' : '100%' }}
                />
              </div>
            </div>

            {/* Step Logs */}
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg text-xs font-mono space-y-1.5 max-h-48 overflow-y-auto">
              <p className="text-emerald-400">✔ Step 1: Voice synthesis completed across scenes</p>
              <p className="text-emerald-400">✔ Step 2: Presentation slide visual layouts compiled</p>
              <p className="text-emerald-400">✔ Step 3: Presenter avatar overlay rendered</p>
              <p className="text-emerald-400">✔ Step 4: Multi-track video composition stitched</p>
              <p className="text-emerald-400">✔ Step 5: WebVTT closed captions generated</p>
              <p className="text-emerald-400">✔ Step 6: 1080p MP4 & HLS playlist encoded</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => {
                  setShowRenderModal(false);
                  setShowPreviewModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Watch Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Embed in Lesson Modal */}
      {showEmbedModal && (
        <Modal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          title="1-Click Embed Video into LMS Lesson"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Attach this rendered video, WebVTT subtitles, and duration directly to a course lesson. The LMS course player will update instantly.
            </p>

            {embedSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-semibold text-emerald-900 text-sm">Successfully Embedded!</h4>
                <p className="text-xs text-emerald-700">
                  The lesson now contains a Video Player block with adaptive streaming and captions.
                </p>
                <div className="pt-2">
                  <Button size="sm" onClick={() => setShowEmbedModal(false)} className="bg-emerald-600 text-white">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Select Target Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Select Target Lesson
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {lessons.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowEmbedModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEmbedSubmit}
                    disabled={embedding || !selectedLessonId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {embedding ? 'Embedding...' : 'Confirm & Embed in Lesson'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Video Preview Player Modal */}
      {showPreviewModal && project.outputVideoUrl && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={`Preview: ${project.title}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={project.thumbnailUrl}
              >
                <source src={project.outputVideoUrl} type="video/mp4" />
                {project.subtitlesUrl && (
                  <track
                    kind="subtitles"
                    src={project.subtitlesUrl}
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
                Your browser does not support HTML5 video.
              </video>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 font-mono text-slate-600">
              <p><span className="font-semibold text-slate-800">MP4 URL:</span> {project.outputVideoUrl}</p>
              <p><span className="font-semibold text-slate-800">HLS Manifest:</span> {project.hlsManifestUrl || 'N/A'}</p>
              <p><span className="font-semibold text-slate-800">WebVTT Captions:</span> {project.subtitlesUrl || 'N/A'}</p>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowPreviewModal(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

