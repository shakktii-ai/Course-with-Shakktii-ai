'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Upload,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  GraduationCap,
  Bot,
  Flame,
  ArrowLeft,
  FileCode,
} from 'lucide-react';

const SAMPLE_TOPICS = [
  {
    title: 'Distributed Systems & Transactional Outbox',
    content: 'Microservices architectures encounter dual-write inconsistencies when updating local database state and dispatching broker events. The Transactional Outbox pattern guarantees at-least-once message delivery by persisting domain events into an outbox collection in the exact same database transaction.',
    difficulty: 'ADVANCED',
  },
  {
    title: 'Full-Stack Next.js 15 & MongoDB Architecture',
    content: 'Next.js App Router provides unified full-stack web applications with React Server Components, Route Handlers, and client hooks. Connecting directly to MongoDB Atlas via cached Mongoose instances enables reliable direct server-side execution without external worker daemons.',
    difficulty: 'INTERMEDIATE',
  },
  {
    title: 'Enterprise RBAC & Multi-Tenant Data Isolation',
    content: 'Multi-tenant applications serve multiple client organizations from a single shared infrastructure. Strict tenantId scoping must be programmatically injected into every database query, ensuring zero cross-tenant data leakage and cryptographic session verification.',
    difficulty: 'INTERMEDIATE',
  },
];

export default function StudentAutoPilotPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [numModules, setNumModules] = useState('auto');
  const [numLessons, setNumLessons] = useState('auto');

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  const STEPS = [
    'Processing uploaded document & extracting knowledge chunks...',
    'Generating structured multi-module curriculum & outline...',
    'Synthesizing deep lesson content, code blocks & citations...',
    'Generating Cloudinary visual architecture diagrams & component flow...',
    'Auto-publishing course & approving review (zero instructor needed)...',
    'Generating comprehensive quizzes & certification exams...',
    'Auto-enrolling your account & preparing lesson player...',
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentName(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer) {
          const uint8 = new Uint8Array(arrayBuffer);
          let rawStr = '';
          for (let i = 0; i < uint8.length; i++) {
            rawStr += String.fromCharCode(uint8[i]);
          }

          // Extract text chunks from PDF streams
          const textMatches = [];
          const regex = /\(([^)]{3,})\)\s*Tj|\[([^\]]{3,})\]\s*TJ/g;
          let match;
          while ((match = regex.exec(rawStr)) !== null) {
            const chunk = (match[1] || match[2] || '')
              .replace(/\\([()\\])/g, '$1')
              .replace(/\\[0-9]{3}/g, ' ')
              .trim();
            if (chunk.length > 2) textMatches.push(chunk);
          }

          if (textMatches.length > 5) {
            setDocumentContent(textMatches.join(' '));
          } else {
            const words = rawStr.match(/[A-Za-z0-9\s.,;:'"()/-]{20,}/g) || [];
            setDocumentContent(words.slice(0, 150).join('\n\n') || `Document: ${file.name}`);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setDocumentContent(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSelectSample = (sample) => {
    setTitle(sample.title);
    setDocumentContent(sample.content);
    setDocumentName(`${sample.title}.txt`);
    setDifficulty(sample.difficulty);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a course topic or upload a document.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      const res = await fetch('/api/v1/learn/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          documentContent: documentContent.trim() || undefined,
          documentName: documentName || undefined,
          difficulty,
          numModules: numModules === 'auto' || documentContent ? 'auto' : (Number(numModules) || 'auto'),
          numLessons: numLessons === 'auto' || documentContent ? 'auto' : (Number(numLessons) || 'auto'),
        }),
      });

      clearInterval(stepInterval);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || 'Automatic generation failed.');
      }

      setCurrentStep(STEPS.length);
      setSuccessResult(data.data);

      setTimeout(() => {
        router.push(data.data.redirectUrl);
      }, 1500);
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/learn/dashboard" className="text-slate-500 hover:text-slate-900 flex items-center gap-1.5 text-xs font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to My Learning
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Autonomous AI Course & Quiz Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload any document, notes, or topic. The AI automatically creates the full course, modules, lessons, and certification quizzes with zero manual instructor overhead.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1 text-xs">
            100% Autonomous • No Instructor Required
          </Badge>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Generation Error</p>
            <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {loading && (
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center animate-spin">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-950">
                Autonomous Course Engine In Progress...
              </h3>
              <p className="text-xs text-emerald-800">
                Building curriculum, synthesizing lesson blocks, generating quizzes, and enrolling your account.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {STEPS.map((stepText, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={stepText}
                  className={`flex items-center gap-2.5 text-xs transition-opacity ${
                    isCompleted
                      ? 'text-emerald-800 font-semibold'
                      : isCurrent
                      ? 'text-emerald-700 font-medium animate-pulse'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isCurrent ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      />
                    )}
                  </div>
                  <span>{stepText}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {successResult && (
        <Card className="border-emerald-300 bg-emerald-50 p-6 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-emerald-950">
            Course & Quizzes Successfully Created!
          </h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            &ldquo;{successResult.course?.title}&rdquo; is now published. Comprehensive quizzes and certification exams have been generated, and you are enrolled!
          </p>
          <div className="pt-2">
            <Link href={successResult.redirectUrl}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <span>Start Learning Now</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {!loading && !successResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleGenerate} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    1. Course Topic or Goal
                  </CardTitle>
                  <CardDescription>
                    What do you want to learn? Enter any subject, skill, or textbook title.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <Label htmlFor="c-title" required>
                      Course Title / Subject
                    </Label>
                    <Input
                      id="c-title"
                      required
                      placeholder="e.g., Enterprise Microservices Architecture with Node.js"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="c-diff">Difficulty Level</Label>
                      <select
                        id="c-diff"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="c-mods">Modules</Label>
                      <select
                        id="c-mods"
                        value={numModules}
                        onChange={(e) => setNumModules(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800"
                      >
                        <option value="auto">✨ Auto (Detect from PDF / Topic)</option>
                        <option value={1}>1 Module</option>
                        <option value={2}>2 Modules</option>
                        <option value={3}>3 Modules</option>
                        <option value={4}>4 Modules</option>
                        <option value={5}>5 Modules</option>
                        <option value={6}>6 Modules</option>
                        <option value={8}>8 Modules</option>
                        <option value={10}>10 Modules</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="c-less">Lessons per Module</Label>
                      <select
                        id="c-less"
                        value={numLessons}
                        onChange={(e) => setNumLessons(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800"
                      >
                        <option value="auto">✨ Auto (Detect from PDF / Topic)</option>
                        <option value={1}>1 Lesson per Module</option>
                        <option value={2}>2 Lessons per Module</option>
                        <option value={3}>3 Lessons per Module</option>
                        <option value={4}>4 Lessons per Module</option>
                        <option value={5}>5 Lessons per Module</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Upload or Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    2. Upload Reference Document or Notes (Optional)
                  </CardTitle>
                  <CardDescription>
                    Provide reference material (PDF, Markdown, Notes, or Textbook text) to ground your course in verified source facts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {/* File Drop Area */}
                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      Upload Document File (.pdf, .txt, .md, .doc)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {documentName ? `Selected: ${documentName}` : 'Click to browse or drop file here'}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx"
                      onChange={handleFileUpload}
                      className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="c-content">Or Paste Source Notes / Text</Label>
                    <textarea
                      id="c-content"
                      rows={5}
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      placeholder="Paste textbook excerpts, technical documentation, or lecture notes..."
                      className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white text-slate-800 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {documentContent && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Loaded {documentContent.length} characters ({Math.ceil(documentContent.length / 4)} tokens)
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-950">
                        🖼️ Cloudinary Visual Architecture Explanations Included
                      </p>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                        Each generated lesson automatically synthesizes an architectural flow diagram, component breakdown, and visual infographic hosted on Cloudinary to explain concepts visually alongside text and code.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm text-sm"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Generate Course, Quizzes & Enroll Me Automatically
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar: Sample Topics */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Quick-Start Sample Topics
                </CardTitle>
                <CardDescription className="text-xs">
                  Click any topic to pre-fill and auto-generate instantly:
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {SAMPLE_TOPICS.map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="w-full p-3 rounded-lg border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 text-left transition text-xs space-y-1 block"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{sample.title}</span>
                      <Badge variant="neutral" className="text-[10px]">
                        {sample.difficulty}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {sample.content}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-slate-100 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-400">
                  <Bot className="w-4 h-4" />
                  Autonomous LMS Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  ✔ <strong>Zero Instructor Dependency:</strong> No manual reviews, approvals, or quiz authors needed.
                </p>
                <p>
                  ✔ <strong>Automated Assessment:</strong> Quizzes and certification exams are generated immediately for each module.
                </p>
                <p>
                  ✔ <strong>Contextual AI Tutor:</strong> 24/7 grounded Q&A is immediately enabled for your generated course.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

