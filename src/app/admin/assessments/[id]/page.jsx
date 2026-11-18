'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  FileCheck,
  PlusCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit3,
  CheckCircle,
  HelpCircle,
  Code,
  ArrowLeft,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  CheckSquare,
} from 'lucide-react';

export default function AssessmentEditorPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const assessmentId = params.id;

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Question Modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    prompt: '',
    questionType: 'MULTIPLE_CHOICE',
    codeSnippet: '',
    points: 1,
    difficulty: 'INTERMEDIATE',
    explanation: '',
    options: [
      { id: 'opt-1', text: '', isCorrect: true, explanation: '' },
      { id: 'opt-2', text: '', isCorrect: false, explanation: '' },
    ],
    correctAnswersText: '',
  });

  const fetchAssessmentData = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/assessments/${assessmentId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setAssessment(data.data.assessment);
        setQuestions(data.data.questions || []);
      }
    } catch (err) {
      console.error('Failed to load assessment', err);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchAssessmentData();
  }, [fetchAssessmentData]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/v1/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAssessmentData();
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQuestionForm({
      prompt: '',
      questionType: 'MULTIPLE_CHOICE',
      codeSnippet: '',
      points: 1,
      difficulty: 'INTERMEDIATE',
      explanation: '',
      options: [
        { id: 'opt-1', text: 'Option A', isCorrect: true, explanation: '' },
        { id: 'opt-2', text: 'Option B', isCorrect: false, explanation: '' },
        { id: 'opt-3', text: 'Option C', isCorrect: false, explanation: '' },
      ],
      correctAnswersText: '',
    });
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestionId(q._id);
    setQuestionForm({
      prompt: q.prompt || '',
      questionType: q.questionType || 'MULTIPLE_CHOICE',
      codeSnippet: q.codeSnippet || '',
      points: q.points || 1,
      difficulty: q.difficulty || 'INTERMEDIATE',
      explanation: q.explanation || '',
      options: q.options || [],
      correctAnswersText: (q.correctAnswers || []).join(', '),
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.prompt.trim()) return;

    try {
      const payload = {
        prompt: questionForm.prompt.trim(),
        questionType: questionForm.questionType,
        codeSnippet: questionForm.codeSnippet,
        points: parseInt(questionForm.points, 10) || 1,
        difficulty: questionForm.difficulty,
        explanation: questionForm.explanation,
        options: questionForm.options,
        correctAnswers: questionForm.correctAnswersText
          ? questionForm.correctAnswersText.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      let url = `/api/v1/assessments/${assessmentId}/questions`;
      let method = 'POST';

      if (editingQuestionId) {
        url = `/api/v1/assessments/${assessmentId}/questions/${editingQuestionId}`;
        method = 'PATCH';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowQuestionModal(false);
        await fetchAssessmentData();
      }
    } catch (err) {
      console.error('Failed to save question', err);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/v1/assessments/${assessmentId}/questions/${qId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchAssessmentData();
      }
    } catch (err) {
      console.error('Failed to delete question', err);
    }
  };

  const handleMoveQuestion = async (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const newArr = [...questions];
    const [moved] = newArr.splice(idx, 1);
    newArr.splice(targetIdx, 0, moved);

    const questionIds = newArr.map((q) => q._id);

    try {
      const res = await fetch(`/api/v1/assessments/${assessmentId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds }),
      });
      if (res.ok) {
        await fetchAssessmentData();
      }
    } catch (err) {
      console.error('Failed to reorder questions', err);
    }
  };

  const handleAddOptionRow = () => {
    const newId = `opt-${Date.now()}`;
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { id: newId, text: '', isCorrect: false, explanation: '' }],
    }));
  };

  const handleRemoveOptionRow = (index) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
        Loading assessment editor...
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Assessment not found.</p>
        <Link href="/admin/assessments">
          <Button variant="outline" className="mt-4">
            Back to Assessments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/assessments" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Assessments
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Question Builder</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{assessment.title}</h1>
            <Badge variant={assessment.status === 'PUBLISHED' ? 'success' : 'secondary'}>
              {assessment.status}
            </Badge>
            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              Pass: {assessment.passingScorePercentage}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/learn/assessments/${assessment._id}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-700">
              <Eye className="w-3.5 h-3.5" />
              Preview Player
            </Button>
          </Link>

          {assessment.status === 'DRAFT' && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishing || questions.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              {publishing ? 'Publishing...' : 'Publish Assessment'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleOpenAddQuestion}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Questions Stack */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No questions in this assessment</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add multiple choice, true/false, fill-in-the-blank, or code challenge questions to complete this evaluation.
            </p>
            <Button onClick={handleOpenAddQuestion} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
              <PlusCircle className="w-4 h-4" />
              Add First Question
            </Button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <Card key={q._id} className="border-slate-200 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase">
                      {q.questionType}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      {q.points || 1} {q.points === 1 ? 'pt' : 'pts'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => handleMoveQuestion(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 hover:text-slate-800 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(idx, 1)}
                      disabled={idx === questions.length - 1}
                      className="p-1 hover:text-slate-800 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-1 hover:text-emerald-600 transition-colors ml-1"
                      title="Edit Question"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q._id)}
                      className="p-1 hover:text-rose-600 transition-colors ml-1"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="font-semibold text-slate-900 text-sm">{q.prompt}</p>

                {q.codeSnippet && (
                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-xs font-mono">
                    <pre>{q.codeSnippet}</pre>
                  </div>
                )}

                {/* Options list */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                          opt.isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {opt.isCorrect && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                            CORRECT
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {q.explanation && (
                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-700 not-italic">Explanation:</span> {q.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {showQuestionModal && (
        <Modal
          isOpen={showQuestionModal}
          onClose={() => setShowQuestionModal(false)}
          title={editingQuestionId ? 'Edit Question' : 'Add Question'}
          size="lg"
        >
          <form onSubmit={handleSaveQuestion} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Question Prompt *
              </label>
              <textarea
                rows={2}
                required
                value={questionForm.prompt}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, prompt: e.target.value }))}
                placeholder="Enter the question text or problem description..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Question Type
                </label>
                <select
                  value={questionForm.questionType}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, questionType: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice (Single Correct)</option>
                  <option value="MULTIPLE_SELECT">Multiple Select (Checkboxes)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="FILL_BLANK">Fill in the Blank</option>
                  <option value="CODE_CHALLENGE">Code Challenge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Points
                </label>
                <input
                  type="number"
                  min={1}
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, points: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Difficulty
                </label>
                <select
                  value={questionForm.difficulty}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            {/* Code Snippet for code challenge */}
            {questionForm.questionType === 'CODE_CHALLENGE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Starter Code Snippet
                </label>
                <textarea
                  rows={3}
                  value={questionForm.codeSnippet}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, codeSnippet: e.target.value }))}
                  placeholder="// Provide starter code or signature..."
                  className="w-full font-mono text-xs px-3 py-2 bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Options list for Multiple Choice & Multiple Select */}
            {(questionForm.questionType === 'MULTIPLE_CHOICE' ||
              questionForm.questionType === 'MULTIPLE_SELECT' ||
              questionForm.questionType === 'TRUE_FALSE') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    Answer Options
                  </label>
                  {questionForm.questionType !== 'TRUE_FALSE' && (
                    <button
                      type="button"
                      onClick={handleAddOptionRow}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {questionForm.options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type={questionForm.questionType === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio'}
                        name="correctChoice"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setQuestionForm((prev) => ({
                            ...prev,
                            options: prev.options.map((item, idx) => {
                              if (questionForm.questionType === 'MULTIPLE_SELECT') {
                                return idx === i ? { ...item, isCorrect: isChecked } : item;
                              }
                              return idx === i ? { ...item, isCorrect: true } : { ...item, isCorrect: false };
                            }),
                          }));
                        }}
                        className="accent-emerald-600"
                      />
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestionForm((prev) => ({
                            ...prev,
                            options: prev.options.map((item, idx) => (idx === i ? { ...item, text: val } : item)),
                          }));
                        }}
                        placeholder={`Option ${i + 1} text...`}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                      {questionForm.questionType !== 'TRUE_FALSE' && questionForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionRow(i)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {questionForm.questionType === 'FILL_BLANK' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Acceptable Matches (comma separated)
                </label>
                <input
                  type="text"
                  value={questionForm.correctAnswersText}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, correctAnswersText: e.target.value }))}
                  placeholder="e.g. microservices, service-oriented architecture, soa"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Answer Explanation & Rationale
              </label>
              <textarea
                rows={2}
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain why the correct answer is right and why other options are incorrect."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowQuestionModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                {editingQuestionId ? 'Update Question' : 'Add Question'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

