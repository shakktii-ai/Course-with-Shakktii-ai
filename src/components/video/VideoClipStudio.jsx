'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  Upload,
  Scissors,
  Sparkles,
  Download,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Lightbulb,
  MessageSquareQuote,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  Film,
  Languages,
  Layers,
  Loader2,
  FolderOpen,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Label } from '@/components/ui/Input';

const LANGUAGES = [
  { value: 'English', label: 'English', hint: 'Clear academic English explanations' },
  { value: 'Marathi-English', label: 'Marathi + English (Mix)', hint: 'Simple Marathi explanations with English technical terms' },
  { value: 'Marathi', label: 'Marathi', hint: 'Complete explanations in Marathi' },
  { value: 'Hindi', label: 'Hindi', hint: 'Complete explanations in Hindi' },
];

const CLIP_STYLES = [
  { value: 'AUTO', label: 'Auto Smart Split', desc: 'AI automatically detects topic changes' },
  { value: 'SHORT', label: 'Bite-Sized Clips', desc: 'Short 15–45s quick revision clips' },
  { value: 'CHAPTERS', label: 'Topic Chapters', desc: 'Deeper 1–3 min learning segments' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function VideoClipStudio({ isAdmin = false }) {
  // View state
  const [viewMode, setViewMode] = useState('STUDIO'); // 'STUDIO' | 'LIBRARY'
  const [savedBreakdowns, setSavedBreakdowns] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  // Upload & form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedDuration, setDetectedDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('English');
  const [clipStyle, setClipStyle] = useState('AUTO');
  const [isDragging, setIsDragging] = useState(false);

  // Processing state
  const [processingStage, setProcessingStage] = useState('IDLE'); // IDLE | UPLOADING | ANALYZING | DONE
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // Active breakdown & clip state
  const [activeBreakdown, setActiveBreakdown] = useState(null);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [playerMode, setPlayerMode] = useState('SYNCED'); // 'SYNCED' | 'TRIMMED' | 'FULL'
  const [clipCurrentSec, setClipCurrentSec] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});

  // Inline clip timing fine-tuner state
  const [editingTiming, setEditingTiming] = useState(false);
  const [draftStart, setDraftStart] = useState(0);
  const [draftEnd, setDraftEnd] = useState(15);
  const [savingTiming, setSavingTiming] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const loadSavedBreakdowns = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const res = await fetch(`/api/v1/video-clips${isAdmin ? '?scope=all' : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSavedBreakdowns(data.data);
      }
    } catch (err) {
      console.error('Failed to load saved video breakdowns:', err);
    } finally {
      setLoadingLibrary(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadSavedBreakdowns();
  }, [loadSavedBreakdowns]);

  const handleFileSelected = (file) => {
    if (!file) return;
    setError('');

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file (.mp4, .mov, .webm, .mkv).');
      return;
    }

    const maxBytes = 100 * 1024 * 1024; // 100MB Cloudinary free-tier video limit
    if (file.size > maxBytes) {
      setError('Video file is larger than 100 MB. Please upload a video under 100 MB.');
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    }

    // Detect duration cleanly in browser
    const tempUrl = URL.createObjectURL(file);
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      setDetectedDuration(Math.round(videoEl.duration || 0));
      URL.revokeObjectURL(tempUrl);
    };
    videoEl.onerror = () => {
      setDetectedDuration(0);
      URL.revokeObjectURL(tempUrl);
    };
    videoEl.src = tempUrl;
  };

  const uploadToCloudinaryWithProgress = (file, signParams) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signParams.apiKey);
      formData.append('timestamp', String(signParams.timestamp));
      formData.append('signature', signParams.signature);
      formData.append('folder', signParams.folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', signParams.uploadUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(pct);
        }
      };

      xhr.onload = () => {
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && parsed.secure_url) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || 'Cloudinary video upload failed'));
          }
        } catch {
          reject(new Error('Invalid response from video upload server'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error while uploading video'));
      xhr.send(formData);
    });
  };

  const handleAnalyzeVideo = async () => {
    if (!selectedFile) {
      setError('Please select a video file first.');
      return;
    }

    setError('');
    setProcessingStage('UPLOADING');
    setUploadProgress(0);

    try {
      // 1. Get signed Cloudinary upload parameters
      const sigRes = await fetch('/api/v1/video-clips/upload-signature', { method: 'POST' });
      const sigData = await sigRes.json();
      if (!sigRes.ok || !sigData.success) {
        throw new Error(sigData.message || sigData.error || 'Could not initialize video upload');
      }

      // 2. Upload video directly to Cloudinary with live progress bar
      const cloudResult = await uploadToCloudinaryWithProgress(selectedFile, sigData.data);
      setUploadProgress(100);

      // 3. Send uploaded video to server for Gemini Multimodal Analysis & Clip Slicing
      setProcessingStage('ANALYZING');
      const analyzeRes = await fetch('/api/v1/video-clips/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || selectedFile.name.replace(/\.[^.]+$/, ''),
          originalFileName: selectedFile.name,
          sourceVideoUrl: cloudResult.secure_url,
          cloudinaryPublicId: cloudResult.public_id,
          durationSeconds: Math.round(cloudResult.duration || detectedDuration || 0),
          fileSizeBytes: cloudResult.bytes || selectedFile.size,
          language,
          clipStyle,
        }),
      });

      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok || !analyzeData.success) {
        throw new Error(analyzeData.message || analyzeData.error || 'AI video analysis failed');
      }

      const breakdown = analyzeData.data;
      setActiveBreakdown(breakdown);
      setActiveClipIndex(0);
      setPlayerMode('SYNCED');
      setEditingTiming(false);
      setQuizAnswers({});
      setProcessingStage('DONE');
      setSelectedFile(null);
      setTitle('');
      setDetectedDuration(0);

      // Refresh library list
      loadSavedBreakdowns();
    } catch (err) {
      console.error('Video clip pipeline error:', err);
      setError(err.message || 'Something went wrong while processing your video.');
      setProcessingStage('IDLE');
    }
  };

  const handleDeleteBreakdown = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/video-clips/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedBreakdowns((prev) => prev.filter((item) => item._id !== id));
        if (activeBreakdown?._id === id) {
          setActiveBreakdown(null);
          setActiveClipIndex(0);
        }
      }
    } catch (err) {
      console.error('Delete breakdown error:', err);
    }
  };

  const handleCopyExplanation = (clip) => {
    const text = [
      `${clip.title} (${clip.startTimeFormatted} - ${clip.endTimeFormatted})`,
      '',
      clip.detailedExplanation,
      '',
      'Key Takeaways:',
      ...(clip.keyTakeaways || []).map((t) => `- ${t}`),
      clip.realWorldExample ? `\nExample: ${clip.realWorldExample}` : '',
    ].join('\n');

    navigator.clipboard?.writeText(text);
    setCopiedId(clip._id || clip.order);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openSavedBreakdown = (item) => {
    setActiveBreakdown(item);
    setActiveClipIndex(0);
    setPlayerMode('SYNCED');
    setEditingTiming(false);
    setQuizAnswers({});
    setViewMode('STUDIO');
    setProcessingStage('DONE');
  };

  const startNewUpload = () => {
    setActiveBreakdown(null);
    setActiveClipIndex(0);
    setEditingTiming(false);
    setProcessingStage('IDLE');
    setError('');
    setViewMode('STUDIO');
  };

  const clips = activeBreakdown?.clips || [];
  const activeClip = clips[activeClipIndex] || null;
  const isBusy = processingStage === 'UPLOADING' || processingStage === 'ANALYZING';

  // Keep synced player locked to the exact start/end timestamps of the active clip
  const activeStartSec = activeClip?.startSeconds ?? 0;
  const activeEndSec = activeClip?.endSeconds ?? 15;
  const effectiveStart = editingTiming ? draftStart : activeStartSec;
  const effectiveEnd = editingTiming ? draftEnd : activeEndSec;

  useEffect(() => {
    if (!activeClip) return;
    setDraftStart(activeClip.startSeconds || 0);
    setDraftEnd(activeClip.endSeconds || (activeClip.startSeconds || 0) + 15);
    setEditingTiming(false);
    setClipCurrentSec(0);

    if (playerMode === 'SYNCED' && videoRef.current) {
      const video = videoRef.current;
      const targetTime = activeClip.startSeconds || 0;
      if (video.readyState >= 1) {
        video.currentTime = targetTime;
        video.play().catch(() => {});
      }
    }
  }, [activeBreakdown?._id, activeClipIndex, activeClip, playerMode]);

  const handleVideoLoadedMetadata = () => {
    if (playerMode === 'SYNCED' && videoRef.current && activeClip) {
      videoRef.current.currentTime = effectiveStart;
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !activeClip) return;

    if (playerMode === 'SYNCED') {
      const curr = video.currentTime;
      const elapsed = Math.max(0, curr - effectiveStart);
      setClipCurrentSec(elapsed);

      if (curr >= effectiveEnd - 0.12 && !video.paused) {
        video.pause();
        video.currentTime = effectiveEnd;
      }
    } else if (playerMode === 'TRIMMED') {
      setClipCurrentSec(video.currentTime);
    }
  };

  const handleReplayClip = () => {
    const video = videoRef.current;
    if (!video || !activeClip) return;
    if (playerMode === 'SYNCED') {
      video.currentTime = effectiveStart;
      video.play().catch(() => {});
    } else {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  const nudgeTiming = (field, delta) => {
    const maxDur = activeBreakdown?.durationSeconds || 3600;
    if (field === 'start') {
      const next = Math.max(0, Math.min(draftEnd - 2, draftStart + delta));
      setDraftStart(next);
      if (playerMode === 'SYNCED' && videoRef.current) {
        videoRef.current.currentTime = next;
      }
    } else {
      const next = Math.max(draftStart + 2, Math.min(maxDur, draftEnd + delta));
      setDraftEnd(next);
      if (playerMode === 'SYNCED' && videoRef.current) {
        videoRef.current.currentTime = Math.max(draftStart, next - 2);
      }
    }
  };

  const handleSaveClipTiming = async () => {
    if (!activeBreakdown?._id || !activeClip?._id) return;
    setSavingTiming(true);
    try {
      const res = await fetch(`/api/v1/video-clips/${activeBreakdown._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId: activeClip._id,
          startSeconds: draftStart,
          endSeconds: draftEnd,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setActiveBreakdown(data.data);
        setSavedBreakdowns((prev) =>
          prev.map((item) => (item._id === data.data._id ? data.data : item))
        );
        setEditingTiming(false);
      }
    } catch (err) {
      console.error('Failed to update clip timing:', err);
    } finally {
      setSavingTiming(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-emerald-900/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
              <Sparkles className="w-3 h-3" /> Gemini Multimodal AI + Cloudinary Clips
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <Scissors className="w-7 h-7 text-emerald-400 shrink-0" />
            AI Video Clips &amp; Explanation Studio
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Upload any long lecture, tutorial, or demo video — AI watches and listens to the full video to automatically generate{' '}
            <strong className="text-emerald-300">topic-wise Short Clips</strong>,{' '}
            clear <strong className="text-emerald-300">AI Explanations</strong>, Key Takeaways, and Mini-Quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant={viewMode === 'LIBRARY' ? 'primary' : 'outline'}
            className={
              viewMode === 'LIBRARY'
                ? ''
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white'
            }
            onClick={() => setViewMode(viewMode === 'LIBRARY' ? 'STUDIO' : 'LIBRARY')}
            leftIcon={<FolderOpen className="w-4 h-4" />}
          >
            Saved Videos ({savedBreakdowns.length})
          </Button>
          {activeBreakdown && (
            <Button
              variant="primary"
              onClick={startNewUpload}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Upload New Video
            </Button>
          )}
        </div>
      </div>

      {/* SAVED BREAKDOWNS LIBRARY VIEW */}
      {viewMode === 'LIBRARY' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-emerald-600" />
              Saved Video Breakdowns
            </CardTitle>
            <CardDescription>
              Revisit any previously analyzed videos, short clips, and AI study notes anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLibrary ? (
              <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                Loading saved videos...
              </div>
            ) : savedBreakdowns.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Video className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-medium">No videos uploaded yet.</p>
                <Button onClick={startNewUpload} leftIcon={<Upload className="w-4 h-4" />}>
                  Upload Your First Video
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedBreakdowns.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => openSavedBreakdown(item)}
                    className="group cursor-pointer rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-400 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative h-36 bg-slate-900 overflow-hidden">
                      {item.clips?.[0]?.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.clips[0].thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Film className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <Badge className="bg-slate-900/80 text-white border-0 backdrop-blur-xs">
                          <Scissors className="w-3 h-3 text-emerald-400" /> {item.clips?.length || 0} Clips
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-0.5 rounded bg-black/75 text-white text-xs font-mono">
                          {formatDuration(item.durationSeconds)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.videoSummary || 'AI generated short clips and explanations.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <Badge variant="slate">{item.language || 'English'}</Badge>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteBreakdown(item._id, e)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete breakdown"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* UPLOAD & CONFIGURE VIEW (when no active breakdown is displayed) */}
      {viewMode === 'STUDIO' && !activeBreakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Dropzone & Options */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Upload Video for AI Slicing &amp; Explanation
              </CardTitle>
              <CardDescription>
                Select an MP4, MOV, WebM, or MKV video (up to 100 MB). AI will automatically slice it into topic clips and generate detailed explanations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelected(file);
                }}
                onClick={() => !isBusy && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70'
                    : selectedFile
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                } ${isBusy ? 'pointer-events-none opacity-75' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <Film className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-900 break-all">{selectedFile.name}</p>
                    <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
                      <Badge variant="emerald">{formatBytes(selectedFile.size)}</Badge>
                      {detectedDuration > 0 && (
                        <Badge variant="sky">
                          <Clock className="w-3 h-3" /> {formatDuration(detectedDuration)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-emerald-700 pt-1">Click again to choose a different video</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Drag &amp; drop your video here, or click to browse
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports MP4, MOV, WebM, MKV • Max size 100 MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Title */}
              <div className="space-y-1.5">
                <Label htmlFor="video-title">Video Title (Optional)</Label>
                <Input
                  id="video-title"
                  placeholder="e.g. React Hooks Tutorial / Physics Chapter 3 Lecture..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              {/* Explanation Language Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-emerald-600" />
                  Explanation Language
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      disabled={isBusy}
                      onClick={() => setLanguage(lang.value)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        language === lang.value
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-900">{lang.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{lang.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clip Style Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Short Clip Length Style
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CLIP_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      disabled={isBusy}
                      onClick={() => setClipStyle(style.value)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        clipStyle === style.value
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-900">{style.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Live Pipeline Progress */}
              {isBusy && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between text-sm font-medium text-emerald-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      {processingStage === 'UPLOADING'
                        ? `Step 1/2: Uploading video to Cloudinary CDN (${uploadProgress}%)...`
                        : 'Step 2/2: Gemini AI is watching & slicing your video into short clips + explanations...'}
                    </span>
                    {processingStage === 'UPLOADING' && (
                      <span className="font-mono text-emerald-700">{uploadProgress}%</span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-emerald-200/70 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-emerald-600 rounded-full transition-all duration-300 ${
                        processingStage === 'ANALYZING' ? 'w-full animate-pulse' : ''
                      }`}
                      style={
                        processingStage === 'UPLOADING'
                          ? { width: `${Math.max(5, uploadProgress)}%` }
                          : undefined
                      }
                    />
                  </div>
                  <p className="text-xs text-emerald-700">
                    {processingStage === 'ANALYZING'
                      ? 'Please wait a moment (typically 20–60 seconds) — AI is watching the entire video to detect exact timestamps and generate explanations for each clip.'
                      : 'Uploading your video directly to Cloudinary CDN...'}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleAnalyzeVideo}
                disabled={!selectedFile || isBusy}
                isLoading={isBusy}
                leftIcon={<Sparkles className="w-5 h-5" />}
              >
                {processingStage === 'UPLOADING'
                  ? `Uploading Video (${uploadProgress}%)...`
                  : processingStage === 'ANALYZING'
                    ? 'AI Generating Short Clips & Explanations...'
                    : 'Generate Short Clips & AI Explanations'}
              </Button>
            </CardContent>
          </Card>

          {/* Right Column: How it Works & Recent */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">Upload Your Video</p>
                    <p className="text-xs text-slate-500">Choose any lecture, coding walkthrough, or tutorial video.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">AI Auto-Slices Topic Clips</p>
                    <p className="text-xs text-slate-500">Gemini analyzes audio &amp; visuals to detect exact start and end timestamps for each topic.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">Play, Download &amp; Learn Faster</p>
                    <p className="text-xs text-slate-500">Every short clip includes clear explanations, key takeaways, examples, and a quick quiz.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {savedBreakdowns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Recent Videos
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewMode('LIBRARY')}
                      className="text-xs text-emerald-600 hover:underline font-medium"
                    >
                      View all
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {savedBreakdowns.slice(0, 4).map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => openSavedBreakdown(item)}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.clips?.length || 0} clips • {formatDuration(item.durationSeconds)} • {item.language}
                        </p>
                      </div>
                      <Play className="w-4 h-4 text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* RESULTS: SHORT CLIPS & EXPLANATION THEATER */}
      {viewMode === 'STUDIO' && activeBreakdown && activeClip && (
        <div className="space-y-6">
          {/* Overall Video Summary Card */}
          <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="emerald">
                    <Scissors className="w-3 h-3" /> {clips.length} Short Clips Generated
                  </Badge>
                  <Badge variant="sky">
                    <Clock className="w-3 h-3" /> Total {formatDuration(activeBreakdown.durationSeconds)}
                  </Badge>
                  <Badge variant="purple">
                    <Languages className="w-3 h-3" /> {activeBreakdown.language}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{activeBreakdown.title}</h2>
                {activeBreakdown.videoSummary && (
                  <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                    {activeBreakdown.videoSummary}
                  </p>
                )}
                {activeBreakdown.overallTopics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeBreakdown.overallTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-lg border border-slate-200">
                {[
                  { id: 'SYNCED', label: 'Exact Synced Clip' },
                  { id: 'TRIMMED', label: 'Trimmed MP4' },
                  { id: 'FULL', label: 'Full Video' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPlayerMode(mode.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      playerMode === mode.id
                        ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Split View: Active Clip + Explanation (Left 8 cols) | Clips List (Right 4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Active Short Clip Video Player & Rich Explanation */}
            <div className="lg:col-span-8 space-y-5">
              {/* Video Player Card */}
              <Card className="overflow-hidden border-slate-200">
                <div className="bg-slate-950 aspect-video relative flex items-center justify-center">
                  <video
                    ref={videoRef}
                    key={
                      playerMode === 'TRIMMED'
                        ? activeClip.clipUrl
                        : activeBreakdown.sourceVideoUrl
                    }
                    src={
                      playerMode === 'TRIMMED'
                        ? activeClip.clipUrl
                        : activeBreakdown.sourceVideoUrl
                    }
                    poster={activeClip.thumbnailUrl || undefined}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onTimeUpdate={handleVideoTimeUpdate}
                    controls
                    playsInline
                    className="w-full h-full max-h-[480px] object-contain"
                  />
                  {playerMode === 'SYNCED' && (
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-xs border border-emerald-400/40 text-emerald-300 text-xs font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Clip #{activeClipIndex + 1}: {formatDuration(effectiveStart)} – {formatDuration(effectiveEnd)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Exact Clip Timeline Indicator (in Synced / Trimmed mode) */}
                {playerMode !== 'FULL' && (
                  <div className="px-4 py-2 bg-slate-900 text-slate-200 flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={handleReplayClip}
                      className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 font-medium shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Replay Clip
                    </button>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-150"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (clipCurrentSec / Math.max(1, effectiveEnd - effectiveStart)) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-slate-300 shrink-0">
                      {formatDuration(clipCurrentSec)} / {formatDuration(Math.max(1, effectiveEnd - effectiveStart))}
                    </span>
                  </div>
                )}

                {/* Clip Control Bar */}
                <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                        <span>
                          CLIP {activeClipIndex + 1} OF {clips.length}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {activeClip.startTimeFormatted} – {activeClip.endTimeFormatted} ({activeClip.durationSeconds}s)
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">{activeClip.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={editingTiming ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setDraftStart(activeClip.startSeconds || 0);
                          setDraftEnd(activeClip.endSeconds || 15);
                          setEditingTiming((v) => !v);
                        }}
                        leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                      >
                        Adjust Timing
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeClipIndex === 0}
                        onClick={() => {
                          setActiveClipIndex((i) => Math.max(0, i - 1));
                        }}
                        leftIcon={<ChevronLeft className="w-4 h-4" />}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeClipIndex >= clips.length - 1}
                        onClick={() => {
                          setActiveClipIndex((i) => Math.min(clips.length - 1, i + 1));
                        }}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Next
                      </Button>
                      {activeClip.downloadUrl && (
                        <a
                          href={activeClip.downloadUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Clip
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Inline Clip Timing Fine-Tuner */}
                  {editingTiming && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-700">Start:</span>
                          <button
                            type="button"
                            onClick={() => nudgeTiming('start', -5)}
                            className="px-2 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100"
                          >
                            -5s
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeTiming('start', -1)}
                            className="px-2 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100"
                          >
                            -1s
                          </button>
                          <span className="px-2.5 py-1 rounded bg-slate-900 text-emerald-300 font-mono text-xs font-semibold">
                            {formatDuration(draftStart)}
                          </span>
                          <button
                            type="button"
                            onClick={() => nudgeTiming('start', 1)}
                            className="px-2 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100"
                          >
                            +1s
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeTiming('start', 5)}
                            className="px-2 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100"
                          >
                            +5s
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-700">End:</span>
                          <button
                            type="button"
                            onClick={() => nudgeTiming('end', -5)}
                            className="px-2 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100"
                          >
                            -5s
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeTiming('end', -1)}
                            className="px-2 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100"
                          >
                            -1s
                          </button>
                          <span className="px-2.5 py-1 rounded bg-slate-900 text-emerald-300 font-mono text-xs font-semibold">
                            {formatDuration(draftEnd)}
                          </span>
                          <button
                            type="button"
                            onClick={() => nudgeTiming('end', 1)}
                            className="px-2 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100"
                          >
                            +1s
                          </button>
                          <button
                            type="button"
                            onClick={() => nudgeTiming('end', 5)}
                            className="px-2 py-1 text-xs rounded bg-white border border-slate-300 hover:bg-slate-100"
                          >
                            +5s
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={savingTiming}
                          onClick={handleSaveClipTiming}
                          leftIcon={<Save className="w-3.5 h-3.5" />}
                        >
                          Save Timing
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTiming(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Detailed Explanation Card */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                      AI Explanation
                    </CardTitle>
                    {activeClip.shortSummary && (
                      <CardDescription className="mt-1">{activeClip.shortSummary}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyExplanation(activeClip)}
                    leftIcon={
                      copiedId === (activeClip._id || activeClip.order) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {copiedId === (activeClip._id || activeClip.order) ? 'Copied!' : 'Copy Notes'}
                  </Button>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Main Detailed Explanation */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-sm leading-7 whitespace-pre-line">
                    {activeClip.detailedExplanation}
                  </div>

                  {/* Key Takeaways */}
                  {activeClip.keyTakeaways?.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Key Takeaways
                      </h4>
                      <ul className="space-y-2">
                        {activeClip.keyTakeaways.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-sm text-slate-700 bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Real-World Example */}
                  {activeClip.realWorldExample && (
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                      <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        Real-World Example
                      </h4>
                      <p className="text-sm text-amber-950/90 leading-relaxed">
                        {activeClip.realWorldExample}
                      </p>
                    </div>
                  )}

                  {/* Transcript Snippet */}
                  {activeClip.transcriptSnippet && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                        <MessageSquareQuote className="w-3.5 h-3.5" />
                        Video Highlight / Spoken Context
                      </h4>
                      <p className="text-sm text-slate-600 italic">
                        &ldquo;{activeClip.transcriptSnippet}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Interactive Mini-Quiz for this Clip */}
                  {activeClip.quiz?.question && (
                    <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                      <h4 className="text-sm font-semibold text-indigo-950 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-indigo-600" />
                        Quick Understanding Check (Clip Quiz)
                      </h4>
                      <p className="text-sm font-medium text-slate-900">{activeClip.quiz.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeClip.quiz.options.map((opt, optIdx) => {
                          const clipKey = `${activeBreakdown._id}-${activeClipIndex}`;
                          const chosen = quizAnswers[clipKey];
                          const isAnswered = chosen !== undefined;
                          const isSelected = chosen === optIdx;
                          const isCorrect = optIdx === activeClip.quiz.correctIndex;

                          let btnClass =
                            'border-slate-200 bg-white hover:border-indigo-400 text-slate-800';
                          if (isAnswered) {
                            if (isCorrect) {
                              btnClass =
                                'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium';
                            } else if (isSelected && !isCorrect) {
                              btnClass = 'border-rose-400 bg-rose-50 text-rose-900';
                            } else {
                              btnClass = 'border-slate-200 bg-white/60 text-slate-500';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() =>
                                setQuizAnswers((prev) => ({ ...prev, [clipKey]: optIdx }))
                              }
                              className={`text-left p-2.5 rounded-lg border text-sm transition-all ${btnClass}`}
                            >
                              <span className="font-semibold mr-1.5">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizAnswers[`${activeBreakdown._id}-${activeClipIndex}`] !== undefined &&
                        activeClip.quiz.explanation && (
                          <p className="text-xs text-indigo-900 bg-white/80 rounded-lg p-2.5 border border-indigo-100">
                            <strong>Explanation:</strong> {activeClip.quiz.explanation}
                          </p>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: All Short Clips Playlist */}
            <Card className="lg:col-span-4 lg:sticky lg:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-emerald-600" />
                    Short Clips ({clips.length})
                  </span>
                  <span className="text-xs font-normal text-slate-500">Click to play</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
                {clips.map((clip, idx) => {
                  const isActive = idx === activeClipIndex;
                  return (
                    <button
                      key={clip._id || idx}
                      type="button"
                      onClick={() => {
                        if (playerMode === 'FULL') setPlayerMode('SYNCED');
                        setActiveClipIndex(idx);
                      }}
                      className={`w-full text-left rounded-xl border p-2.5 transition-all flex gap-3 items-start ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      {/* Clip Thumbnail */}
                      <div className="relative w-24 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                        {clip.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={clip.thumbnailUrl}
                            alt={clip.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <Play className="w-5 h-5" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                          {clip.durationSeconds}s
                        </span>
                      </div>

                      {/* Clip Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 font-semibold">
                          <span>#{idx + 1}</span>
                          <span>•</span>
                          <span>
                            {clip.startTimeFormatted}–{clip.endTimeFormatted}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-2 mt-0.5">
                          {clip.title}
                        </p>
                        {clip.shortSummary && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {clip.shortSummary}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoClipStudio;
