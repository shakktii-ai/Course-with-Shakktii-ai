'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Database,
  Layers,
  CheckCircle,
  FileText,
  Clock,
  Target,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export default function NewAICourseWizardPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Brief, 2: Sources, 3: Outline Review, 4: Generating
  const [sources, setSources] = useState([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState([]);

  // Step 1: Brief Form
  const [title, setTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('Full-Stack Developers');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [durationHours, setDurationHours] = useState('4');
  const [numModules, setNumModules] = useState('auto');
  const [numLessons, setNumLessons] = useState('auto');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [objectives, setObjectives] = useState([]);

  // Step 3: Generated Outline
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [outline, setOutline] = useState(null);

  // Step 4: Generating Course
  const [generatingFullCourse, setGeneratingFullCourse] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadSources() {
      try {
        const res = await fetch('/api/v1/sources');
        const data = await res.json();
        if (data.success) {
          setSources(data.data || []);
        }
      } catch (err) {
        console.error('Error loading sources:', err);
      }
    }
    loadSources();
  }, []);

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setObjectives([...objectives, objectiveInput.trim()]);
      setObjectiveInput('');
    }
  };

  const removeObjective = (idx) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
  };

  const toggleSource = (sourceId) => {
    if (selectedSourceIds.includes(sourceId)) {
      setSelectedSourceIds(selectedSourceIds.filter((id) => id !== sourceId));
    } else {
      setSelectedSourceIds([...selectedSourceIds, sourceId]);
    }
  };

  // Generate Outline
  const handleGenerateOutline = async () => {
    setGeneratingOutline(true);
    setErrorMsg(null);
    try {
      const isAuto = selectedSourceIds.length > 0 || !numModules || numModules === 'auto';
      const brief = {
        title: title.trim(),
        targetAudience: targetAudience.trim(),
        difficulty,
        durationHours: parseFloat(durationHours) || 4,
        numModules: isAuto ? 'auto' : (parseInt(numModules, 10) || 'auto'),
        numLessons: isAuto ? 'auto' : (parseInt(numLessons, 10) || 'auto'),
        learningObjectives: objectives,
      };

      const res = await fetch('/api/v1/ai/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          sourceDocumentIds: selectedSourceIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Outline generation failed');
      }

      setOutline(data.data.outline);
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGeneratingOutline(false);
    }
  };

  // Generate Full Course
  const handleGenerateFullCourse = async () => {
    setGeneratingFullCourse(true);
    setErrorMsg(null);
    try {
      const brief = {
        title: title.trim(),
        targetAudience: targetAudience.trim(),
        difficulty,
        durationHours: parseFloat(durationHours) || 4,
        objectives,
      };

      const res = await fetch('/api/v1/ai/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          outline,
          sourceDocumentIds: selectedSourceIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Course generation failed');
      }

      // Redirect to review page
      router.push(`/admin/studio/review?reviewId=${data.data.review._id}`);
    } catch (err) {
      setErrorMsg(err.message);
      setGeneratingFullCourse(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Wizard Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/studio" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            AI Studio
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-emerald-600" />
          AI Course Generator Wizard
        </h1>
        <p className="text-sm text-slate-500">
          Transform raw technical documents into structured, cited, and assessment-ready courses.
        </p>
      </div>

      {/* Stepper Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 text-sm font-semibold">
        <div className={`flex items-center gap-2 ${step === 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            1
          </span>
          <span>Course Brief</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-2 ${step === 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            2
          </span>
          <span>Attach Sources</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            3
          </span>
          <span>Review Outline</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: BRIEF FORM */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Define Course Brief</CardTitle>
            <CardDescription>
              Provide instruction guidance, learner profile, and syllabus boundaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label required>Course Title</Label>
              <Input
                placeholder="e.g. Distributed Consensus & Cloud Storage"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Target Audience</Label>
                <Input
                  placeholder="e.g. Senior Backend Engineers"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
              <div>
                <Label>Difficulty Level</Label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  min="1"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Target Modules</Label>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Auto by AI</span>
                </div>
                <Input
                  placeholder="auto (or enter number e.g. 5)"
                  value={numModules}
                  onChange={(e) => setNumModules(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Lessons Per Module</Label>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Auto by AI</span>
                </div>
                <Input
                  placeholder="auto (or enter number e.g. 3)"
                  value={numLessons}
                  onChange={(e) => setNumLessons(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Learning Objectives</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g. Master vector embedding pipelines"
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addObjective();
                    }
                  }}
                />
                <Button type="button" onClick={addObjective} variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-1.5">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 border rounded text-xs text-slate-700">
                    <span>{obj}</span>
                    <button type="button" onClick={() => removeObjective(i)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                disabled={!title.trim()}
                onClick={() => setStep(2)}
              >
                Next: Select Source Documents &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

        {/* STEP 2: ATTACH SOURCES */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Attach Source Documents for Grounding</CardTitle>
              <CardDescription>
                Select indexed materials to serve as ground truth for citations and lesson explanations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                {sources.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg">
                    <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No source documents uploaded yet.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      You can proceed with general AI generation or visit the Source Library to upload manuals.
                    </p>
                    <Link href="/admin/source-library">
                      <Button variant="outline" size="sm" className="mt-3">
                        Go to Source Library
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                    {sources.map((src) => {
                      const isSelected = selectedSourceIds.includes(src._id);
                      return (
                        <div
                          key={src._id}
                          onClick={() => toggleSource(src._id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {src.fileType}
                          </span>
                          <span>{src.chunkCount || 0} Chunks</span>
                        </div>
                        <div className="text-sm font-bold truncate">{src.title}</div>
                        <div className="text-xs text-slate-400 truncate">{src.originalFilename}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedSourceIds.length > 0 && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 mt-3 shadow-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">AI Smart Structure Active</p>
                    <p className="text-emerald-700 mt-0.5">
                      Gemini will automatically analyze your document&apos;s Table of Contents, chapters, and sections to discover the authentic number of modules (1, 5, 10+) and lessons directly from the PDF.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(1)}>
                &larr; Back
              </Button>
              <Button onClick={handleGenerateOutline} loading={generatingOutline}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Course Outline &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: REVIEW OUTLINE */}
      {step === 3 && outline && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Generated Course Outline</CardTitle>
              <CardDescription>
                Review the proposed module and lesson structure before triggering full content generation.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateOutline} loading={generatingOutline}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <h3 className="font-bold text-slate-900">{outline.title}</h3>
              <p className="text-xs text-slate-600">{outline.summary}</p>
            </div>

            <div className="space-y-4">
              {outline.modules?.map((mod, mIdx) => (
                <div key={mIdx} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="p-3 bg-slate-100 font-semibold text-slate-800 text-sm flex items-center justify-between">
                    <span>{mod.title}</span>
                    <span className="text-xs text-slate-500 font-normal">{mod.lessons?.length || 0} Lessons</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {mod.lessons?.map((les, lIdx) => (
                      <div key={lIdx} className="p-3 pl-6 flex items-start justify-between text-xs text-slate-700">
                        <div>
                          <div className="font-semibold text-slate-900">{les.title}</div>
                          <div className="text-slate-500 mt-0.5">{les.summary}</div>
                        </div>
                        <span className="text-slate-400 shrink-0 font-mono">{les.durationMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(2)}>
                &larr; Back
              </Button>
              <Button onClick={handleGenerateFullCourse} loading={generatingFullCourse}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Full Course & Citations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

