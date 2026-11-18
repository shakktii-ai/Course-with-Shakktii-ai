'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Headphones,
  Sparkles,
  Settings,
  ChevronDown,
} from 'lucide-react';

/**
 * Clean markdown and code formatting to produce clean, natural spoken speech text
 */
function cleanTextForSpeech(text = '') {
  if (!text) return '';
  return text
    // Replace markdown code blocks with an announcement
    .replace(/```[\s\S]*?```/g, ' [Code example omitted for audio narration] ')
    // Remove inline code ticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links but keep text: [Title](url) -> Title
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove markdown headers #, ##, ###
    .replace(/#{1,6}\s+/g, '')
    // Remove bold/italics
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove blockquote >
    .replace(/^\s*>\s+/gm, '')
    // Remove bullet points
    .replace(/^\s*[-*+]\s+/gm, '')
    // Remove excess whitespace and newlines
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into reasonable chunks (~150-250 characters) on sentence boundaries
 * to avoid browser SpeechSynthesis truncation bugs
 */
function splitIntoSpokenChunks(fullText) {
  if (!fullText) return [];
  // Split on sentence ends (. ! ? or semicolons)
  const sentences = fullText.match(/[^.!?;\n]+[.!?;\n]+|[^.!?;\n]+$/g) || [fullText];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).length > 200 && current.length > 0) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current = current ? `${current} ${trimmed}` : trimmed;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

export default function VoiceLessonPlayer({
  lesson,
  courseTitle = '',
  onComplete,
  className = '',
}) {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0); // 0.8, 1.0, 1.25, 1.5
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const synthRef = useRef(null);
  const utteranceRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentChunkIndexRef = useRef(0);
  isPlayingRef.current = isPlaying;
  currentChunkIndexRef.current = currentChunkIndex;

  // Prepare full script for this lesson
  const spokenChunks = useMemo(() => {
    if (!lesson) return [];
    const parts = [];
    if (lesson.title) parts.push(`Lesson: ${lesson.title}.`);
    if (lesson.description) parts.push(cleanTextForSpeech(lesson.description));
    if (lesson.articleContent) parts.push(cleanTextForSpeech(lesson.articleContent));

    const combined = parts.join(' ');
    return splitIntoSpokenChunks(combined);
  }, [lesson]);

  // Initialize SpeechSynthesis and available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices() || [];
        setVoices(available);
        if (available.length > 0 && !selectedVoiceUri) {
          // Prefer Indian English / US English / Local language if available
          const preferred =
            available.find((v) => v.lang === 'en-IN' || v.name.includes('India')) ||
            available.find((v) => v.lang.startsWith('en')) ||
            available[0];
          if (preferred) setSelectedVoiceUri(preferred.voiceURI);
        }
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedVoiceUri]);

  // Play a specific chunk
  const speakChunk = useCallback((index) => {
    if (!synthRef.current || !spokenChunks[index]) {
      setIsPlaying(false);
      setIsPaused(false);
      if (onComplete) onComplete();
      return;
    }

    synthRef.current.cancel();

    const chunkText = spokenChunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utteranceRef.current = utterance;

    if (selectedVoiceUri && voices.length > 0) {
      const v = voices.find((item) => item.voiceURI === selectedVoiceUri);
      if (v) utterance.voice = v;
    }

    utterance.rate = rate;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onend = () => {
      const nextIndex = currentChunkIndexRef.current + 1;
      if (nextIndex < spokenChunks.length && isPlayingRef.current) {
        setCurrentChunkIndex(nextIndex);
        speakChunk(nextIndex);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentChunkIndex(0);
        if (onComplete) onComplete();
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech error/interrupted:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [spokenChunks, selectedVoiceUri, voices, rate, isMuted, onComplete]);

  // Play / Pause Handlers
  const handlePlayPause = () => {
    if (!supported || spokenChunks.length === 0) return;

    if (isPlaying) {
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }
      setIsPlaying(false);
      setIsPaused(true);
    } else {
      speakChunk(currentChunkIndex);
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
  };

  const handleNextChunk = () => {
    const nextIdx = Math.min(spokenChunks.length - 1, currentChunkIndex + 1);
    setCurrentChunkIndex(nextIdx);
    if (isPlaying) {
      speakChunk(nextIdx);
    }
  };

  const handlePrevChunk = () => {
    const prevIdx = Math.max(0, currentChunkIndex - 1);
    setCurrentChunkIndex(prevIdx);
    if (isPlaying) {
      speakChunk(prevIdx);
    }
  };

  const handleRateChange = (newRate) => {
    setRate(newRate);
    if (isPlaying) {
      speakChunk(currentChunkIndex);
    }
  };

  const handleVoiceChange = (e) => {
    setSelectedVoiceUri(e.target.value);
    if (isPlaying) {
      speakChunk(currentChunkIndex);
    }
  };

  const progressPercent = spokenChunks.length > 0
    ? Math.round(((currentChunkIndex + 1) / spokenChunks.length) * 100)
    : 0;

  if (!supported) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-100 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPlaying ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Voice Course Narration
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                {progressPercent}% Complete
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              {isPlaying ? 'Currently playing spoken audio...' : 'Listen to this lesson hands-free'}
            </p>
          </div>
        </div>

        {/* Playback Equalizer animation */}
        {isPlaying && (
          <div className="flex items-end gap-1 h-5 px-3 py-1 bg-emerald-950/40 border border-emerald-800/50 rounded-full">
            <span className="w-1 bg-emerald-400 h-3 animate-pulse rounded-full" />
            <span className="w-1 bg-emerald-400 h-5 animate-pulse rounded-full delay-75" />
            <span className="w-1 bg-emerald-400 h-2 animate-pulse rounded-full delay-150" />
            <span className="w-1 bg-emerald-400 h-4 animate-pulse rounded-full delay-100" />
            <span className="text-[10px] text-emerald-400 ml-1.5 font-medium">Audio Active</span>
          </div>
        )}
      </div>

      {/* Spoken Paragraph Preview (Subtitle style) */}
      {spokenChunks.length > 0 && (
        <div className="my-3 px-3 py-2 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300 font-sans italic line-clamp-2">
          &ldquo;{spokenChunks[currentChunkIndex] || 'Ready to narrate...'}&rdquo;
        </div>
      )}

      {/* Audio Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Rewind */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrevChunk}
            disabled={currentChunkIndex === 0}
            className="text-slate-400 hover:text-white p-2 h-8 w-8"
            title="Previous Section"
          >
            <Rewind className="w-4 h-4" />
          </Button>

          {/* Main Play/Pause */}
          <Button
            size="sm"
            onClick={handlePlayPause}
            className={`h-9 px-4 font-semibold ${isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-1.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                {isPaused ? 'Resume' : 'Listen to Lesson'}
              </>
            )}
          </Button>

          {/* Forward */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNextChunk}
            disabled={currentChunkIndex >= spokenChunks.length - 1}
            className="text-slate-400 hover:text-white p-2 h-8 w-8"
            title="Next Section"
          >
            <FastForward className="w-4 h-4" />
          </Button>

          {/* Stop / Reset */}
          {(isPlaying || isPaused) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStop}
              className="text-slate-400 hover:text-rose-400 p-2 h-8 w-8"
              title="Stop Narration"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Speed & Settings */}
        <div className="flex items-center gap-2">
          {/* Speed Pills */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            {[0.8, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleRateChange(s)}
                className={`px-2 py-1 rounded transition-colors ${rate === s ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Voice Selector Toggle */}
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs ${settingsOpen ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'}`}
            title="Voice & Accent Settings"
          >
            <Settings className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Voice Selection Drawer */}
      {settingsOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-slate-400 shrink-0 font-medium">Narration Voice:</span>
            <select
              value={selectedVoiceUri}
              onChange={handleVoiceChange}
              className="w-full sm:w-72 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Speech synthesis runs natively with 0 latency
          </span>
        </div>
      )}
    </div>
  );
}

