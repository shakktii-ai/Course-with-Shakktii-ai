'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Mic,
  Volume2,
  Play,
  Square,
  PlusCircle,
  ArrowLeft,
  Sparkles,
  Globe,
  Sliders,
  Check,
  RefreshCw,
  User,
} from 'lucide-react';

export default function VoiceLibraryPage() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  // Custom Voice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVoiceForm, setNewVoiceForm] = useState({
    name: '',
    language: 'en',
    languageName: 'English',
    gender: 'FEMALE',
    speedRate: 1.0,
    pitch: 1.0,
  });
  const [creating, setCreating] = useState(false);

  const fetchVoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/video/voices');
      const data = await res.json();
      if (data.success && data.data) {
        setVoices(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load voice profiles', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const togglePlayAudio = (voiceId) => {
    if (playingVoiceId === voiceId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(voiceId);
      // Auto-stop after 4 seconds
      setTimeout(() => {
        setPlayingVoiceId((current) => (current === voiceId ? null : current));
      }, 4000);
    }
  };

  const handleCreateCustomVoice = async (e) => {
    e.preventDefault();
    if (!newVoiceForm.name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/v1/video/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVoiceForm.name.trim(),
          language: newVoiceForm.language,
          languageName: newVoiceForm.languageName,
          gender: newVoiceForm.gender,
          settings: {
            speedRate: newVoiceForm.speedRate,
            pitch: newVoiceForm.pitch,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewVoiceForm({
          name: '',
          language: 'en',
          languageName: 'English',
          gender: 'FEMALE',
          speedRate: 1.0,
          pitch: 1.0,
        });
        await fetchVoices();
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredVoices = voices.filter((v) => {
    if (selectedLanguage !== 'ALL' && v.language !== selectedLanguage) return false;
    if (selectedGender !== 'ALL' && v.gender !== selectedGender) return false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/video" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Video Studio
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Voice Library</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Neural Voice Library</h1>
              <p className="text-sm text-slate-500">
                High-definition multi-lingual neural speech synthesis profiles for video narrations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Custom Voice
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Language Filter */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 uppercase">Language:</span>
          {['ALL', 'en', 'hi', 'mr', 'te'].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedLanguage === lang
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lang === 'ALL'
                ? 'All'
                : lang === 'en'
                ? 'English'
                : lang === 'hi'
                ? 'Hindi'
                : lang === 'mr'
                ? 'Marathi'
                : 'Telugu'}
            </button>
          ))}
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 uppercase">Gender:</span>
          {['ALL', 'FEMALE', 'MALE'].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGender(g)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedGender === g
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {g === 'ALL' ? 'All' : g.charAt(0) + g.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Voices Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading neural voices...
        </div>
      ) : filteredVoices.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <Mic className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No voices matching the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVoices.map((voice) => {
            const isPlaying = playingVoiceId === voice.voiceId;
            return (
              <Card
                key={voice._id || voice.voiceId}
                className={`border transition-all ${
                  isPlaying ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' : 'border-slate-200'
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-base">{voice.name}</h3>
                        {voice.isCustom && (
                          <Badge variant="warning" className="text-[10px]">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{voice.voiceId}</p>
                    </div>

                    <Badge variant="secondary" className="text-xs uppercase">
                      {voice.languageName || voice.language}
                    </Badge>
                  </div>

                  {/* Audio Preview Card */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <button
                      onClick={() => togglePlayAudio(voice.voiceId)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        isPlaying
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={isPlaying ? 'Stop' : 'Play Sample'}
                    >
                      {isPlaying ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Wave animation simulator */}
                    <div className="flex items-center gap-1 h-6">
                      {[12, 20, 16, 24, 18, 14, 22, 10].map((h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all ${
                            isPlaying
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-300'
                          }`}
                          style={{ height: isPlaying ? `${h}px` : '6px' }}
                        />
                      ))}
                    </div>

                    <span className="text-[11px] font-mono text-slate-500">
                      {isPlaying ? 'Playing...' : 'Sample'}
                    </span>
                  </div>

                  {/* Settings metadata */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {voice.gender}
                    </span>
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      Speed: {voice.settings?.speedRate || 1.0}x
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Custom Voice Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add Custom Neural Voice"
          size="md"
        >
          <form onSubmit={handleCreateCustomVoice} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Voice Profile Name
              </label>
              <input
                type="text"
                required
                value={newVoiceForm.name}
                onChange={(e) => setNewVoiceForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Executive Corporate Voice (Female)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Language
                </label>
                <select
                  value={newVoiceForm.language}
                  onChange={(e) => {
                    const lang = e.target.value;
                    const map = { en: 'English', hi: 'Hindi', mr: 'Marathi', te: 'Telugu' };
                    setNewVoiceForm((prev) => ({ ...prev, language: lang, languageName: map[lang] }));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="en">English (US)</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="te">Telugu (తెలుగు)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Gender
                </label>
                <select
                  value={newVoiceForm.gender}
                  onChange={(e) => setNewVoiceForm((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Default Speech Rate ({newVoiceForm.speedRate}x)
              </label>
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.05}
                value={newVoiceForm.speedRate}
                onChange={(e) => setNewVoiceForm((prev) => ({ ...prev, speedRate: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="bg-emerald-600 text-white">
                {creating ? 'Saving...' : 'Create Voice Profile'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

