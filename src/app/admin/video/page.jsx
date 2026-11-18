'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Video,
  Play,
  PlusCircle,
  Mic,
  FolderOpen,
  Clock,
  Sparkles,
  Layers,
  RefreshCw,
  Trash2,
  ExternalLink,
  Film,
  MonitorPlay,
  CheckCircle,
} from 'lucide-react';

export default function VideoStudioDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [previewProject, setPreviewProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renderingId, setRenderingId] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/video/projects');
      const data = await res.json();
      if (data.success && data.data) {
        setProjects(data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load video projects', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleTriggerRender = async (projectId) => {
    setRenderingId(projectId);
    try {
      const res = await fetch(`/api/v1/video/projects/${projectId}/render?sync=true`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await fetchProjects();
      }
    } finally {
      setRenderingId(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/v1/video/projects/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const totalMinutes = Math.round(
    projects.reduce((acc, p) => acc + (p.totalDurationSeconds || 0), 0) / 60
  );
  const readyCount = projects.filter((p) => p.status === 'READY').length;
  const renderingCount = projects.filter((p) => p.status === 'RENDERING').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Video Studio</h1>
              <p className="text-sm text-slate-500">
                Automated multi-scene script generation, neural voice synthesis, and video production
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/video/voices">
            <Button variant="outline" size="sm" className="gap-2">
              <Mic className="w-4 h-4 text-emerald-600" />
              Voice Library
            </Button>
          </Link>
          <Link href="/admin/media-library">
            <Button variant="outline" size="sm" className="gap-2">
              <FolderOpen className="w-4 h-4 text-slate-600" />
              Media Assets
            </Button>
          </Link>
          <Link href="/admin/video/create">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <PlusCircle className="w-4 h-4" />
              Create Video
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Video Projects</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
              <Video className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ready for LMS</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{readyCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rendering in Queue</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{renderingCount}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <RefreshCw className={`w-5 h-5 ${renderingCount > 0 ? 'animate-spin' : ''}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Video Duration</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalMinutes} <span className="text-sm font-normal text-slate-500">mins</span></p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {['ALL', 'READY', 'RENDERING', 'DRAFT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Projects' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchProjects} className="gap-1.5 text-slate-600">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading video projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <Film className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No video projects found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Generate your first AI video from existing lesson content or build one from a custom prompt.
          </p>
          <Link href="/admin/video/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Sparkles className="w-4 h-4" />
              Create First Video
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project._id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
              {/* Thumbnail / Video Canvas Preview */}
              <div className="relative aspect-video bg-slate-950 flex flex-col justify-between p-4 text-white">
                <div className="flex items-center justify-between z-10">
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
                  <span className="text-[11px] font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                    {project.aspectRatio || '16:9'} • {project.resolution || '1080p'}
                  </span>
                </div>

                <div className="my-auto text-center px-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
                    {project.scenesCount || 0} Scenes
                  </p>
                  <h4 className="text-sm font-semibold line-clamp-2 text-slate-100">
                    {project.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 z-10">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {project.totalDurationSeconds || 0}s
                  </span>
                  {project.status === 'READY' && (
                    <button
                      onClick={() => setPreviewProject(project)}
                      className="p-1.5 bg-emerald-600/80 hover:bg-emerald-600 rounded-full transition-colors"
                      title="Play Preview"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{project.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {project.description || 'AI-generated presentation and structured scenes.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/video/${project._id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Layers className="w-3.5 h-3.5" />
                        Edit Studio
                      </Button>
                    </Link>
                    {project.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => handleTriggerRender(project._id)}
                        disabled={renderingId === project._id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        {renderingId === project._id ? 'Rendering...' : 'Render'}
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(project)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Player Modal */}
      {previewProject && (
        <Modal
          isOpen={!!previewProject}
          onClose={() => setPreviewProject(null)}
          title={`Preview: ${previewProject.title}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={previewProject.thumbnailUrl}
              >
                <source src={previewProject.outputVideoUrl} type="video/mp4" />
                {previewProject.subtitlesUrl && (
                  <track
                    kind="subtitles"
                    src={previewProject.subtitlesUrl}
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
                Your browser does not support HTML5 video.
              </video>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 font-mono text-slate-600">
              <p><span className="font-semibold text-slate-800">MP4 URL:</span> {previewProject.outputVideoUrl}</p>
              <p><span className="font-semibold text-slate-800">HLS Stream:</span> {previewProject.hlsManifestUrl || 'N/A'}</p>
              <p><span className="font-semibold text-slate-800">WebVTT Subtitles:</span> {previewProject.subtitlesUrl || 'N/A'}</p>
            </div>

            <div className="flex justify-end gap-2">
              <Link href={`/admin/video/${previewProject._id}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Studio
                </Button>
              </Link>
              <Button onClick={() => setPreviewProject(null)} size="sm">
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Video Project"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.title}</strong>? All scenes, narration audio, and rendered assets will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteProject}>
                Delete Project
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

