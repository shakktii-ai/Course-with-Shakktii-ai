'use client';

import React, { useState } from 'react';
import {
  Layers,
  Maximize2,
  Minimize2,
  Download,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function LessonDiagramBlock({ block, lessonTitle }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);

  const content = block?.content || {};
  const url = content.url || '';
  const caption = content.caption || block?.title || 'Visual Concept & Architecture Diagram';
  const nodes = Array.isArray(content.nodes) ? content.nodes : [];
  const isCloudinary = Boolean(content.isCloudinary);

  if (!url) return null;

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(lessonTitle || 'architecture-diagram').toLowerCase().replace(/\s+/g, '-')}-diagram.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-xl my-6">
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>{block.title || 'Visual Architecture & Flow Diagram'}</span>
            </h4>
            <p className="text-[11px] text-slate-400 line-clamp-1">{caption}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCloudinary ? (
            <Badge
              variant="outline"
              className="text-[10px] bg-emerald-950/60 border-emerald-700/50 text-emerald-400 flex items-center gap-1 font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloudinary CDN Optimized
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] bg-slate-900 border-slate-700 text-slate-300 flex items-center gap-1 font-mono"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Vector Blueprint
            </Badge>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsZoomed(true)}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-7 px-2"
            title="Inspect Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Zoom</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-7 px-2"
            title="Download Diagram"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {/* Main Diagram Canvas */}
      <div
        className="relative bg-slate-950/60 p-2 sm:p-4 cursor-pointer group flex items-center justify-center overflow-hidden"
        onClick={() => setIsZoomed(true)}
      >
        <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={caption}
            className="w-full h-auto object-contain block bg-slate-950"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full border border-slate-700 shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              Click to Inspect Fullscreen
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Component Navigation */}
      {nodes.length > 0 && (
        <div className="p-4 bg-slate-900/40 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              Interactive Component Breakdown:
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              Click any step to inspect technical details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {nodes.map((node, idx) => {
              const isSelected = selectedNodeIndex === idx;
              const label = typeof node === 'string' ? node : node.label;
              const desc = typeof node === 'string' ? '' : node.desc;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedNodeIndex(idx)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/60 shadow-xs'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">{label}</span>
                  </div>
                  {desc && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-4 sm:p-8 flex flex-col justify-between"
          onClick={() => setIsZoomed(false)}
        >
          {/* Modal Header */}
          <div
            className="flex items-center justify-between pb-4 border-b border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">{caption}</h3>
              <p className="text-xs text-slate-400">{lessonTitle} • High-Resolution Architectural Vector</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload} className="text-xs h-8">
                <Download className="w-3.5 h-3.5 mr-1" /> Download
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

          {/* Modal Image Viewer */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={caption}
              className="max-h-[80vh] w-auto max-w-full rounded-xl border border-slate-800 shadow-2xl object-contain"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 text-center text-xs text-slate-500">
            Click anywhere outside or press Close to return to the lesson player.
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonDiagramBlock;

