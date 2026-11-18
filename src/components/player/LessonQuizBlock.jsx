'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Award,
} from 'lucide-react';

export default function LessonQuizBlock({ block, lessonTitle = '' }) {
  // Extract questions from various potential content structures
  const rawQuestions =
    block?.content?.questions ||
    block?.content?.quiz ||
    block?.content?.items ||
    (Array.isArray(block?.content) ? block.content : null);

  // If questions exist, normalize them; otherwise provide a grounded knowledge-check fallback
  const questions = (rawQuestions && rawQuestions.length > 0)
    ? rawQuestions.map((q, idx) => {
        const questionText = q.question || q.prompt || q.title || `Question ${idx + 1}`;
        const rawOptions = q.options || q.choices || [
          'Yes, this pattern enforces boundary isolation and data consistency.',
          'No, services should share global database state directly.',
          'Only if background workers are disabled in staging.',
          'None of the above.',
        ];

        const options = rawOptions.map((opt) => (typeof opt === 'string' ? opt : opt.text || opt.label || 'Option'));
        const correctIndex = typeof q.correctAnswerIndex === 'number'
          ? q.correctAnswerIndex
          : (typeof q.correctOption === 'number' ? q.correctOption : 0);
        const explanation = q.explanation || 'Strict tenant isolation and validated state boundaries guarantee system resilience and data privacy in multi-tenant environments.';

        return {
          id: q._id || `q-${idx}`,
          questionText,
          options,
          correctIndex,
          explanation,
        };
      })
    : [
        {
          id: 'q-fallback-1',
          questionText: `What is the primary architectural takeaway from "${lessonTitle || 'this lesson'}"?`,
          options: [
            'Enforce strict isolation, input validation, and resilient error recovery',
            'Allow unvalidated external payloads directly into database collections',
            'Disable background workers to speed up transactional execution',
            'Rely exclusively on client-side state without server-side verification',
          ],
          correctIndex: 0,
          explanation: 'Production cloud architectures require strict server-side boundary validation, tenant isolation, and fault-tolerant background execution.',
        },
      ];

  // User selections: { [qIdx]: selectedOptionIndex }
  const [selectedAnswers, setSelectedAnswers] = useState({});
  // Submitted states: { [qIdx]: boolean }
  const [submitted, setSubmitted] = useState({});

  const handleSelect = (qIdx, optIdx) => {
    if (submitted[qIdx]) return; // lock once submitted
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = (qIdx) => {
    if (selectedAnswers[qIdx] === undefined) return;
    setSubmitted((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleReset = (qIdx) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qIdx];
      return copy;
    });
    setSubmitted((prev) => {
      const copy = { ...prev };
      delete copy[qIdx];
      return copy;
    });
  };

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(submitted).length;
  const correctCount = Object.entries(submitted).filter(([qIdx, isSub]) => {
    return isSub && selectedAnswers[qIdx] === questions[Number(qIdx)]?.correctIndex;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              {block?.title || 'Knowledge Check Quiz'}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Interactive Quiz
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Test your understanding of the concepts covered in this lesson
            </p>
          </div>
        </div>

        {answeredCount > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Score: {correctCount}/{answeredCount}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const isQSubmitted = Boolean(submitted[qIdx]);
          const selectedOpt = selectedAnswers[qIdx];
          const isCorrect = isQSubmitted && selectedOpt === q.correctIndex;

          return (
            <div
              key={q.id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-bold shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <p className="font-medium text-slate-100 text-sm sm:text-base leading-snug">
                  {q.questionText}
                </p>
              </div>

              {/* Options List */}
              <div className="space-y-2.5 pl-0 sm:pl-9">
                {q.options.map((optText, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  const isThisCorrect = optIdx === q.correctIndex;

                  let optionStyle = 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60';

                  if (isSelected && !isQSubmitted) {
                    optionStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/50';
                  } else if (isQSubmitted) {
                    if (isThisCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-100 ring-1 ring-emerald-500 font-medium';
                    } else if (isSelected && !isThisCorrect) {
                      optionStyle = 'border-rose-500 bg-rose-950/50 text-rose-200 ring-1 ring-rose-500/50';
                    } else {
                      optionStyle = 'border-slate-850 bg-slate-950/30 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isQSubmitted}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs border shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-snug">{optText}</span>
                      </div>

                      {isQSubmitted && isThisCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {isQSubmitted && isSelected && !isThisCorrect && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons & Explanation */}
              <div className="pl-0 sm:pl-9 pt-1">
                {!isQSubmitted ? (
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(qIdx)}
                    disabled={selectedOpt === undefined}
                    className="h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Check Answer
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                      isCorrect
                        ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        {isCorrect ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Correct! Excellent understanding.</span>
                          </>
                        ) : (
                          <>
                            <span className="text-rose-400">Incorrect.</span>
                            <span className="text-slate-400 ml-1">
                              Correct answer: Option {String.fromCharCode(65 + q.correctIndex)}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-slate-300 mt-1">
                        <span className="font-semibold text-slate-200">Explanation:</span> {q.explanation}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReset(qIdx)}
                      className="h-7 text-xs text-slate-400 hover:text-white"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Try Question Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

