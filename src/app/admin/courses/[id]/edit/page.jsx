'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Video,
  FileText,
  Save,
  CheckCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
} from 'lucide-react';

export default function CurriculumStudioPage({ params }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;

  const [courseData, setCourseData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);

  // Course Form
  const [title, setTitle] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [durationHours, setDurationHours] = useState('2');

  // Module Modal
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  // Lesson Modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState('ARTICLE');
  const [lessonDuration, setLessonDuration] = useState('5');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonIsPreview, setLessonIsPreview] = useState(false);

  // Content Block Modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [targetLessonId, setTargetLessonId] = useState(null);
  const [blockType, setBlockType] = useState('TEXT');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockBody, setBlockBody] = useState('');

  // Version snapshot modal
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionChangelog, setVersionChangelog] = useState('');

  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' | 'settings' | 'versions'

  const fetchFullCourse = useCallback(async () => {
    setLoading(true);
    try {
      const [resFull, resCats, resVers] = await Promise.all([
        fetch(`/api/v1/courses/${courseId}?full=true`),
        fetch('/api/v1/categories'),
        fetch(`/api/v1/courses/${courseId}/versions`),
      ]);

      const [dataFull, dataCats, dataVers] = await Promise.all([
        resFull.json(),
        resCats.json(),
        resVers.json(),
      ]);

      if (dataFull.success) {
        setCourseData(dataFull.data);
        const c = dataFull.data.course;
        setTitle(c.title || '');
        setHeadline(c.headline || '');
        setDescription(c.description || '');
        setCategoryId(c.categoryId?._id || c.categoryId || '');
        setDifficulty(c.difficulty || 'BEGINNER');
        setVisibility(c.visibility || 'PUBLIC');
        setDurationHours(String(c.durationHours || 2));
      }

      if (dataCats.success) {
        setCategories(dataCats.data || []);
      }

      if (dataVers.success) {
        setVersions(dataVers.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchFullCourse();
  }, [fetchFullCourse]);

  // Save general course info
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          headline,
          description,
          categoryId: categoryId || undefined,
          difficulty,
          visibility,
          durationHours: parseFloat(durationHours) || 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Course settings saved!');
      } else {
        alert(data.error?.message || 'Failed to save');
      }
    } finally {
      setSavingCourse(false);
    }
  };

  // Add Module
  const handleAddModule = async () => {
    if (!moduleTitle.trim()) return;
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleTitle.trim(),
          description: moduleDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModuleModalOpen(false);
        setModuleTitle('');
        setModuleDesc('');
        fetchFullCourse();
      } else {
        alert(data.error?.message || 'Failed to add module');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    try {
      const res = await fetch(`/api/v1/modules/${moduleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchFullCourse();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Lesson
  const handleAddLesson = async () => {
    if (!lessonTitle.trim() || !targetModuleId) return;
    try {
      const res = await fetch(`/api/v1/modules/${targetModuleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle.trim(),
          type: lessonType,
          durationMinutes: parseInt(lessonDuration, 10) || 5,
          videoUrl: lessonVideoUrl.trim(),
          articleContent: lessonContent.trim(),
          isPreview: lessonIsPreview,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLessonModalOpen(false);
        setLessonTitle('');
        setLessonVideoUrl('');
        setLessonContent('');
        fetchFullCourse();
      } else {
        alert(data.error?.message || 'Failed to create lesson');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      const res = await fetch(`/api/v1/lessons/${lessonId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchFullCourse();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Content Block
  const handleAddBlock = async () => {
    if (!targetLessonId) return;
    try {
      const res = await fetch(`/api/v1/lessons/${targetLessonId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: blockType,
          title: blockTitle.trim(),
          content: { body: blockBody.trim() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockModalOpen(false);
        setBlockTitle('');
        setBlockBody('');
        fetchFullCourse();
      } else {
        alert(data.error?.message || 'Failed to add content block');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Create Snapshot Version
  const handleCreateVersion = async () => {
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changelog: versionChangelog.trim() || 'Manual revision snapshot',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVersionModalOpen(false);
        setVersionChangelog('');
        fetchFullCourse();
        alert('New version snapshot saved successfully!');
      } else {
        alert(data.error?.message || 'Failed to create version');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Rollback to version
  const handleRollback = async (versionId) => {
    if (!confirm('Rollback course curriculum to this version? Current draft changes will be replaced.')) return;
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/versions/${versionId}/rollback`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchFullCourse();
      } else {
        alert(data.error?.message || 'Rollback failed');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading Curriculum Studio...
      </div>
    );
  }

  const { course, modules } = courseData || {};

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/admin/courses/${courseId}`} className="text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Course Overview
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            Curriculum Builder Studio: {course?.title}
          </h1>
          <p className="text-sm text-slate-500">
            Structure your course syllabus, compose multi-format lessons, and manage version snapshots.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setVersionModalOpen(true)}>
            <History className="w-4 h-4 mr-2" />
            Take Snapshot
          </Button>
          <Link href={`/admin/courses/${courseId}`}>
            <Button>
              <CheckCircle className="w-4 h-4 mr-2" />
              Done Editing
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'curriculum'
              ? 'border-emerald-600 text-emerald-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Curriculum Builder ({modules?.length || 0} Modules)
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-emerald-600 text-emerald-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Course Settings
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'versions'
              ? 'border-emerald-600 text-emerald-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Version History ({versions.length})
        </button>
      </div>

      {/* TAB 1: CURRICULUM BUILDER */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Syllabus Architecture</h2>
            <Button onClick={() => setModuleModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add New Module
            </Button>
          </div>

          {modules?.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-500">
                <Layers className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <h3 className="font-semibold text-slate-800 text-base">Your curriculum is empty</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  Click Add New Module to create your first course section, then add video or article lessons inside it.
                </p>
                <Button className="mt-4" onClick={() => setModuleModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add First Module
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {modules.map((mod, modIdx) => (
                <div key={mod._id} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  {/* Module Header Bar */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {modIdx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{mod.title}</div>
                        {mod.description && <div className="text-xs text-slate-500">{mod.description}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetModuleId(mod._id);
                          setLessonModalOpen(true);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Lesson
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteModule(mod._id)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Lessons List within this Module */}
                  <div className="divide-y divide-slate-100">
                    {mod.lessons?.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        No lessons in this module. Click Add Lesson to add one.
                      </div>
                    ) : (
                      mod.lessons.map((les, lesIdx) => (
                        <div key={les._id} className="p-4 pl-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50">
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-semibold text-slate-400 mt-1">
                              {modIdx + 1}.{lesIdx + 1}
                            </span>
                            {les.type === 'VIDEO' ? (
                              <Video className="w-4 h-4 text-purple-600 mt-0.5" />
                            ) : (
                              <FileText className="w-4 h-4 text-emerald-600 mt-0.5" />
                            )}
                            <div>
                              <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                {les.title}
                                {les.isPreview && <Badge variant="outline">Preview</Badge>}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{les.durationMinutes} mins</span>
                                {les.blocks?.length > 0 && (
                                  <span>• {les.blocks.length} Content Blocks</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTargetLessonId(les._id);
                                setBlockModalOpen(true);
                              }}
                              title="Add Content Block"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add Block
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteLesson(les._id)}
                              className="text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COURSE METADATA & SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveCourse} className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label required>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Difficulty</Label>
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

              <div>
                <Label>Headline</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
              </div>

              <div>
                <Label>Description</Label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Visibility</Label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </div>
                <div>
                  <Label>Duration (Hours)</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" loading={savingCourse}>
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </CardContent>
          </Card>
        </form>
      )}

      {/* TAB 3: VERSION HISTORY & ROLLBACK */}
      {activeTab === 'versions' && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Version Snapshots</h2>
              <p className="text-xs text-slate-500">
                Snapshots represent immutable states of your course syllabus. You can revert to any prior state.
              </p>
            </div>
            <Button onClick={() => setVersionModalOpen(true)}>
              <History className="w-4 h-4 mr-2" /> Take Snapshot Now
            </Button>
          </div>

          <div className="space-y-3">
            {versions.map((ver) => (
              <Card key={ver._id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Version {ver.versionNumber}: {ver.title}
                      </span>
                      <Badge variant={ver.status === 'PUBLISHED' ? 'success' : 'outline'}>
                        {ver.status}
                      </Badge>
                      {ver.isImmutable && <span className="text-xs text-slate-400 font-mono">(Immutable)</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{ver.changelog}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Created on {new Date(ver.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollback(ver._id)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Revert to this Version
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD MODULE */}
      <Modal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title="Create New Module"
        description="Add a top-level section or unit to your course structure."
      >
        <div className="space-y-4">
          <div>
            <Label required>Module Title</Label>
            <Input
              placeholder="e.g. Unit 1: Foundations & Architecture"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              rows={3}
              placeholder="Module overview and learning goals..."
              value={moduleDesc}
              onChange={(e) => setModuleDesc(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModuleModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddModule}>Create Module</Button>
        </ModalFooter>
      </Modal>

      {/* MODAL: ADD LESSON */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title="Add New Lesson"
        description="Add a learning activity or content unit to this module."
      >
        <div className="space-y-4">
          <div>
            <Label required>Lesson Title</Label>
            <Input
              placeholder="e.g. Setting Up Redis Queue Infrastructure"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lesson Type</Label>
              <select
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ARTICLE">Article / Text</option>
                <option value="VIDEO">Video Lesson</option>
                <option value="QUIZ">Quiz / Assessment</option>
                <option value="RESOURCE">Downloadable Resource</option>
              </select>
            </div>
            <div>
              <Label>Duration (Minutes)</Label>
              <Input
                type="number"
                min="1"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(e.target.value)}
              />
            </div>
          </div>

          {lessonType === 'VIDEO' && (
            <div>
              <Label>Video Stream URL (MP4 / HLS / Embed)</Label>
              <Input
                placeholder="https://cdn.example.com/videos/lesson1.mp4"
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
              />
            </div>
          )}

          {lessonType === 'ARTICLE' && (
            <div>
              <Label>Article Markdown Content</Label>
              <textarea
                rows={5}
                placeholder="Write lesson text or markdown guidelines here..."
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="previewCheckbox"
              checked={lessonIsPreview}
              onChange={(e) => setLessonIsPreview(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="previewCheckbox" className="text-xs text-slate-700 font-medium">
              Allow Free Preview for un-enrolled learners
            </label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setLessonModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddLesson}>Create Lesson</Button>
        </ModalFooter>
      </Modal>

      {/* MODAL: ADD CONTENT BLOCK */}
      <Modal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title="Add Content Block"
        description="Append a rich content element into this lesson."
      >
        <div className="space-y-4">
          <div>
            <Label>Block Type</Label>
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="TEXT">Rich Text / Markdown</option>
              <option value="VIDEO">Video Stream</option>
              <option value="PDF">PDF Viewer</option>
              <option value="RESOURCE">Downloadable File</option>
              <option value="EMBED">Interactive Embed</option>
            </select>
          </div>

          <div>
            <Label>Block Title (Optional)</Label>
            <Input
              placeholder="e.g. Architecture Overview Diagram"
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Block Content / URL / Markdown</Label>
            <textarea
              rows={4}
              placeholder="Content text or media link..."
              value={blockBody}
              onChange={(e) => setBlockBody(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setBlockModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddBlock}>Append Block</Button>
        </ModalFooter>
      </Modal>

      {/* MODAL: VERSION SNAPSHOT */}
      <Modal
        isOpen={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        title="Take Immutable Version Snapshot"
        description="Preserve the exact current syllabus structure as an immutable course revision."
      >
        <div className="space-y-4">
          <div>
            <Label required>Changelog / Revision Summary</Label>
            <textarea
              rows={3}
              placeholder="Summarize the changes made in this version..."
              value={versionChangelog}
              onChange={(e) => setVersionChangelog(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setVersionModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateVersion}>Save Snapshot</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

