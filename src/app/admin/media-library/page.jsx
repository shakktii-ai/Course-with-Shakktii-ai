'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  FolderOpen,
  Film,
  Mic,
  Image as ImageIcon,
  FileText,
  Search,
  Trash2,
  ExternalLink,
  HardDrive,
  Copy,
  Check,
  RefreshCw,
  Play,
  ArrowLeft,
} from 'lucide-react';

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState([]);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [previewAsset, setPreviewAsset] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchMediaData = useCallback(async () => {
    setLoading(true);
    try {
      const [resAssets, resStorage] = await Promise.all([
        fetch(`/api/v1/media?limit=100${activeType !== 'ALL' ? `&mediaType=${activeType}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
        fetch('/api/v1/media/storage'),
      ]);

      const [dataAssets, dataStorage] = await Promise.all([
        resAssets.json(),
        resStorage.json(),
      ]);

      if (dataAssets.success && dataAssets.data) {
        setAssets(dataAssets.data.items || []);
      }
      if (dataStorage.success && dataStorage.data) {
        setStorage(dataStorage.data);
      }
    } catch (err) {
      console.error('Failed to load media assets', err);
    } finally {
      setLoading(false);
    }
  }, [activeType, search]);

  useEffect(() => {
    fetchMediaData();
  }, [fetchMediaData]);

  const handleDeleteAsset = async (assetId) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    try {
      const res = await fetch(`/api/v1/media/${assetId}`, { method: 'DELETE' });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a._id !== assetId));
        await fetchMediaData();
      }
    } catch (err) {
      console.error('Failed to delete asset', err);
    }
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/video" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Video Studio
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Media Library</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Media Asset Repository</h1>
              <p className="text-sm text-slate-500">
                Centralized storage and distribution of videos, audio narrations, slide graphics, and subtitles
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchMediaData} className="gap-2 text-slate-700">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Storage
        </Button>
      </div>

      {/* Storage Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Total Storage
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2">
              {formatBytes(storage?.totalBytes || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
              <Film className="w-4 h-4 text-emerald-600" />
              Videos
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2">
              {storage?.breakdown?.VIDEO?.count || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
              <Mic className="w-4 h-4 text-blue-600" />
              Audio Tracks
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2">
              {storage?.breakdown?.AUDIO?.count || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              Images & Slides
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2">
              {storage?.breakdown?.IMAGE?.count || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
              <FileText className="w-4 h-4 text-purple-600" />
              Subtitles
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2">
              {storage?.breakdown?.SUBTITLE?.count || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Type tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'VIDEO', 'AUDIO', 'SUBTITLE', 'IMAGE'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeType === t
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t === 'ALL' ? 'All Assets' : t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading media library...
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No media assets found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Card key={asset._id} className="border-slate-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                      {asset.mediaType === 'VIDEO' ? (
                        <Film className="w-5 h-5 text-emerald-600" />
                      ) : asset.mediaType === 'AUDIO' ? (
                        <Mic className="w-5 h-5 text-blue-600" />
                      ) : asset.mediaType === 'SUBTITLE' ? (
                        <FileText className="w-5 h-5 text-purple-600" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">{asset.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono line-clamp-1">{asset.storageKey}</p>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-[10px]">
                    {asset.mediaType}
                  </Badge>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg text-[11px] font-mono text-slate-600 flex items-center justify-between">
                  <span>Size: {formatBytes(asset.sizeBytes)}</span>
                  {asset.durationSeconds > 0 && <span>Duration: {asset.durationSeconds}s</span>}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {(asset.mediaType === 'VIDEO' || asset.mediaType === 'AUDIO') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewAsset(asset)}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-600" />
                        Preview
                      </Button>
                    )}
                    <button
                      onClick={() => handleCopyUrl(asset.url, asset._id)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === asset._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteAsset(asset._id)}
                    className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewAsset && (
        <Modal
          isOpen={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
          title={`Preview: ${previewAsset.name}`}
          size="md"
        >
          <div className="space-y-4">
            {previewAsset.mediaType === 'VIDEO' ? (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                <video controls autoPlay className="w-full h-full object-contain">
                  <source src={previewAsset.url} type={previewAsset.mimeType || 'video/mp4'} />
                  Your browser does not support HTML5 video.
                </video>
              </div>
            ) : (
              <div className="p-6 bg-slate-900 rounded-lg text-center space-y-3">
                <Mic className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                <audio controls autoPlay className="w-full">
                  <source src={previewAsset.url} type={previewAsset.mimeType || 'audio/mpeg'} />
                  Your browser does not support HTML5 audio.
                </audio>
              </div>
            )}

            <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-mono break-all text-slate-700">
              <span className="font-semibold text-slate-900">URL:</span> {previewAsset.url}
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setPreviewAsset(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
