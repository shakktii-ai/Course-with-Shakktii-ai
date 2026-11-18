'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  Info,
  Download,
  X,
  Bot,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function AIVisualLessonExplainer({ block, lessonTitle, courseId }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const utteranceRef = useRef(null);

  const content = block?.content || {};
  
  // Support multiple fresh images per module/lesson
  const multipleImages = Array.isArray(content.images) && content.images.length > 0
    ? content.images
    : [
        {
          url: content.url || '',
          title: content.title || block?.title || `Visual Concept: ${lessonTitle}`,
          caption: content.caption || 'AI-generated visual concept and architecture flow',
          teachingSteps: content.teachingSteps,
          audioTeacherScript: content.audioTeacherScript,
          label: '01. Overview & Fundamentals',
        },
      ];

  const currentImage = multipleImages[activeImageIndex] || multipleImages[0];
  const displayedUrl = currentImage.url || content.url || '';
  const url = displayedUrl;
  const title = currentImage.title || content.title || block?.title || `Visual Concept: ${lessonTitle}`;
  const caption = currentImage.caption || content.caption || 'AI-generated visual concept and architecture flow';
  
  const teachingSteps = Array.isArray(currentImage.teachingSteps) && currentImage.teachingSteps.length > 0
    ? currentImage.teachingSteps
    : (Array.isArray(content.teachingSteps) && content.teachingSteps.length > 0
      ? content.teachingSteps
      : (Array.isArray(content.nodes) ? content.nodes.map((n, i) => ({
          step: i + 1,
          title: typeof n === 'string' ? n : (n.label || `Component 0${i + 1}`),
          explanation: typeof n === 'string' ? '' : (n.desc || 'System execution boundary'),
          visualFocus: `Step 0${i + 1} component node`,
        })) : []));

  const audioScript = currentImage.audioTeacherScript || content.audioTeacherScript ||
    `Let us examine this visual diagram for ${lessonTitle}. It illustrates the end-to-end component flow, validated domain boundaries, and compliance safeguards.`;

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleVoiceTeacher = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Prepare full teaching narrative combining all steps
    const fullScript = `${audioScript}. Let us review each key stage: ` +
      teachingSteps
        .map((step, idx) => `Step ${idx + 1}: ${step.title}. ${step.explanation}`)
        .join('. ');

    const utterance = new SpeechSynthesisUtterance(fullScript);
    utteranceRef.current = utterance;
    utterance.rate = 0.95; // comfortable educational pace
    utterance.pitch = 1.0;

    // Pick a high-clarity voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en'))
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setAudioProgress(100);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleDownload = () => {
    try {
      const targetUrl = displayedUrl || url;
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = `${(lessonTitle || 'ai-visual').toLowerCase().replace(/\s+/g, '-')}-${activeViewMode.toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  if (!url && !displayedUrl) return null;

  const activeStep = teachingSteps[activeStepIndex] || teachingSteps[0];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 overflow-hidden shadow-2xl my-8">
      {/* Top Banner: AI Visual Teacher Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-950/80 border-emerald-700/60 text-emerald-300 font-mono"
              >
                ✨ AI Concept Visual
              </Badge>
              {content.isCloudinary && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-sky-950/60 border-sky-700/50 text-sky-300 font-mono flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Cloudinary CDN
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{caption}</p>
          </div>
        </div>

        {/* Audio Teacher & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleToggleVoiceTeacher}
            className={`text-xs h-8 px-3 transition-all ${
              isPlayingAudio
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse shadow-md shadow-emerald-900/50'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1.5 text-white" />
                <span>Pause Voice Teacher</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span>Explain Visual (Voice)</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsZoomed(true)}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8 px-2"
            title="View Fullscreen Lightbox"
          >
            <Maximize2 className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Zoom</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8 px-2"
            title="Download Image"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Multiple Visuals Gallery Selector (Every module multiple fresh images) */}
      {multipleImages.length > 1 && (
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Module Visuals ({multipleImages.length}):
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {multipleImages.map((img, idx) => {
              const isActive = activeImageIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setActiveStepIndex(0);
                    if (isPlayingAudio && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      setIsPlayingAudio(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <span>{img.label || `Visual 0${idx + 1}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Image Stage */}
      <div
        className="relative bg-slate-900/60 p-3 sm:p-5 flex items-center justify-center cursor-pointer group overflow-hidden"
        onClick={() => setIsZoomed(true)}
      >
        <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl transition-all duration-300 group-hover:border-emerald-500/50 group-hover:scale-[1.008] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayedUrl}
            alt={caption}
            className="w-full h-auto max-h-[480px] object-contain block mx-auto bg-white"
            loading="lazy"
          />

          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-slate-900/90 text-white text-xs px-3.5 py-1.5 rounded-full border border-slate-700 shadow-xl flex items-center gap-1.5 backdrop-blur-xs">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              Click to Inspect High-Resolution Visual
            </span>
          </div>

          {/* Pulsing Audio Indicator Badge when voice teacher is playing */}
          {isPlayingAudio && (
            <div className="absolute top-3 left-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Voice Teacher Explaining Visual...</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Step-by-Step Teaching Walkthrough (ani shiktana te mg expaain karun shikavych) */}
      <div className="p-4 sm:p-6 bg-slate-900/50 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Step-by-Step Visual Walkthrough
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any step to reveal detailed component explanation
          </span>
        </div>

        {/* Step Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {teachingSteps.map((step, idx) => {
            const isSelected = activeStepIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Stage 0{idx + 1}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-xs font-semibold truncate mt-1">
                  {step.title.replace(/^\d+\.\s*/, '')}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep Explanation Box */}
        {activeStep && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-emerald-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {activeStep.title}
              </span>
              {activeStep.visualFocus && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                  Look at: {activeStep.visualFocus}
                </span>
              )}
            </div>
            <p className="leading-relaxed text-slate-300">
              {activeStep.explanation}
            </p>
          </div>
        )}

        {/* Footer Action: Ask AI Tutor About This Image */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <p className="text-[11px] text-slate-500">
            Have questions about this visual flow?
          </p>

          <Link href={`/learn/tutor`}>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800 h-8"
            >
              <Bot className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <span>Ask AI Tutor About This Diagram</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-4 sm:p-8 flex flex-col justify-between"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="flex items-center justify-between pb-4 border-b border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">{caption}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload} className="text-xs h-8">
                <Download className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayedUrl || url}
              alt={caption}
              className="max-h-[82vh] w-auto max-w-full rounded-xl border border-slate-800 shadow-2xl object-contain"
            />
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            Click outside or press Close to return to course player
          </div>
        </div>
      )}
    </div>
  );
}

export default AIVisualLessonExplainer;

