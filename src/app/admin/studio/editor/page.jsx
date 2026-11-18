'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Input';
import {
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  Globe,
  FileQuestion,
  RotateCw,
} from 'lucide-react';

export default function AIContentEditorPage() {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('REWRITE');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTransform = async (selectedMode) => {
    if (!content.trim()) {
      alert('Please enter or paste source content first');
      return;
    }

    const activeMode = selectedMode || mode;
    setMode(activeMode);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          mode: activeMode,
          language,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (typeof data.data.result === 'object') {
          setResult(JSON.stringify(data.data.result, null, 2));
        } else {
          setResult(data.data.result);
        }
      } else {
        alert(data.error?.message || 'Transformation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/studio" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            AI Studio
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-emerald-600" />
          AI Content Assistant & Transformation Studio
        </h1>
        <p className="text-sm text-slate-500">
          Refine drafts, generate assessments, simplify dense technical passages, or localize content.
        </p>
      </div>

      {/* Toolbar Action Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={mode === 'REWRITE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTransform('REWRITE')}
        >
          <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Professional Rewrite
        </Button>
        <Button
          variant={mode === 'SIMPLIFY' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTransform('SIMPLIFY')}
        >
          <Minimize2 className="w-3.5 h-3.5 mr-1.5" /> Simplify
        </Button>
        <Button
          variant={mode === 'EXPAND' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTransform('EXPAND')}
        >
          <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Expand
        </Button>
        <Button
          variant={mode === 'SUMMARIZE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTransform('SUMMARIZE')}
        >
          Executive Summary
        </Button>
        <Button
          variant={mode === 'QUIZ' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTransform('QUIZ')}
        >
          <FileQuestion className="w-3.5 h-3.5 mr-1.5" /> Generate Quiz
        </Button>
        <Button
          variant={mode === 'TRANSLATE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTransform('TRANSLATE')}
        >
          <Globe className="w-3.5 h-3.5 mr-1.5" /> Translate
        </Button>
      </div>

      {/* Editor Split View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Text Input */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Input Text / Draft Material</CardTitle>
            <CardDescription className="text-xs">
              Paste lesson paragraphs, document chunks, or course notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-3">
            <textarea
              rows={16}
              placeholder="Paste raw text or draft lesson here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 p-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>{content.length} characters</span>
              <Button size="sm" onClick={() => handleTransform(mode)} loading={loading}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Execute {mode}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Transformed Output */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">AI Result Output</CardTitle>
              <CardDescription className="text-xs">Transformed text or generated assessment.</CardDescription>
            </div>
            {result && (
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-3">
            <div className="w-full flex-1 p-3 text-sm bg-white border border-slate-200 rounded-md overflow-y-auto font-sans leading-relaxed text-slate-800 whitespace-pre-wrap">
              {loading ? (
                <div className="py-20 text-center text-slate-400 italic">
                  AI transformation in progress...
                </div>
              ) : result ? (
                result
              ) : (
                <div className="py-20 text-center text-slate-400 italic">
                  Select an action chip above to generate results.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

