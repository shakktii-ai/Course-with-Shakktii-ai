'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import VoiceLessonPlayer from '@/components/player/VoiceLessonPlayer';
import LessonQuizBlock from '@/components/player/LessonQuizBlock';
import LessonDiagramBlock from '@/components/player/LessonDiagramBlock';
import AIVisualLessonExplainer from '@/components/player/AIVisualLessonExplainer';
import {
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Play,
  Video,
  FileText,
  Bookmark,
  Share2,
  Menu,
  X,
  MessageSquare,
  Download,
  ExternalLink,
  Headphones,
} from 'lucide-react';

export default function CoursePlayerPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { courseId, lessonId } = unwrappedParams;

  const [curriculum, setCurriculum] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [percentComplete, setPercentComplete] = useState(0);
  const [loading, setLoading] = useState(true);

  // Notes & Bookmarks
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Action Loading
  const [completing, setCompleting] = useState(false);

  const fetchPlayerState = useCallback(async () => {
    setLoading(true);
    try {
      const [resCurr, resLesson, resProg, resBkmk, resNotes] = await Promise.all([
        fetch(`/api/v1/courses/${courseId}?full=true`),
        fetch(`/api/v1/lessons/${lessonId}`),
        fetch(`/api/v1/learn/progress?courseId=${courseId}`),
        fetch('/api/v1/learn/bookmarks'),
        fetch(`/api/v1/learn/notes?courseId=${courseId}&lessonId=${lessonId}`),
      ]);

      const [dataCurr, dataLesson, dataProg, dataBkmk, dataNotes] = await Promise.all([
        resCurr.json(),
        resLesson.json(),
        resProg.json(),
        resBkmk.json(),
        resNotes.json(),
      ]);

      if (dataCurr.success) setCurriculum(dataCurr.data);
      if (dataLesson.success) setCurrentLesson(dataLesson.data);
      if (dataProg.success) {
        setCompletedLessonIds(new Set(dataProg.data.completedLessonIds || []));
        setPercentComplete(dataProg.data.progress?.percentComplete || 0);
      }
      if (dataBkmk.success) {
        const found = (dataBkmk.data || []).some((b) => String(b.lessonId?._id) === String(lessonId));
        setIsBookmarked(found);
      }
      if (dataNotes.success) {
        setNotes(dataNotes.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchPlayerState();
  }, [fetchPlayerState]);

  // Find previous and next lessons in ordered curriculum tree
  const getAllLessonsFlat = () => {
    if (!curriculum?.modules) return [];
    const flat = [];
    for (const mod of curriculum.modules) {
      for (const les of mod.lessons || []) {
        flat.push({ ...les, moduleTitle: mod.title });
      }
    }
    return flat;
  };

  const allLessons = getAllLessonsFlat();
  const currentIndex = allLessons.findIndex((l) => String(l._id) === String(lessonId));
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Toggle or mark completed
  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/v1/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpentSeconds: 60 }),
      });
      const data = await res.json();
      if (data.success) {
        setCompletedLessonIds(new Set([...completedLessonIds, lessonId]));
        setPercentComplete(data.data.percentComplete || 0);

        // Auto advance to next lesson if available
        if (nextLesson) {
          router.push(`/learn/player/${courseId}/${nextLesson._id}`);
        }
      }
    } finally {
      setCompleting(false);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await fetch(`/api/v1/learn/bookmarks?lessonId=${lessonId}`, { method: 'DELETE' });
        setIsBookmarked(false);
      } else {
        await fetch('/api/v1/learn/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, lessonId, title: currentLesson?.title }),
        });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  // Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await fetch('/api/v1/learn/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          lessonId,
          content: newNote.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes([data.data, ...notes]);
        setNewNote('');
      }
    } catch (err) {
      console.error('Note creation error:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        Loading interactive player...
      </div>
    );
  }

  const isCurrentComplete = completedLessonIds.has(lessonId);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-900 text-slate-100">
      {/* Top Player Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href={`/learn/courses/${courseId}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white line-clamp-1">{curriculum?.course?.title}</h1>
            <p className="text-xs text-slate-400 line-clamp-1">{currentLesson?.title}</p>
          </div>
        </div>

        {/* Progress Bar in Header */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 w-48">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 font-mono shrink-0">{percentComplete}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleBookmark}
              className={isBookmarked ? 'text-amber-400' : 'text-slate-400'}
              title="Bookmark Lesson"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotesPanelOpen(!notesPanelOpen)}
              className={notesPanelOpen ? 'text-emerald-400' : 'text-slate-400'}
              title="Lesson Notes"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400"
              title="Toggle Syllabus Sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace (Player Content + Sidebar) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left / Center: Lesson Content Stream */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Video Player Display if VIDEO lesson */}
            {currentLesson?.type === 'VIDEO' && currentLesson?.videoUrl && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
                <iframe
                  src={currentLesson.videoUrl}
                  title={currentLesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Lesson Title & Header */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                    {currentLesson?.type || 'ARTICLE'} LESSON
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    <Headphones className="w-3 h-3" /> Voice Narration Ready
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Estimated duration: {currentLesson?.durationMinutes} mins
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{currentLesson?.title}</h2>
            </div>

            {/* AI Voice Course Narration Player */}
            <VoiceLessonPlayer
              lesson={currentLesson}
              courseTitle={curriculum?.course?.title}
            />

            {/* Article Markdown Content */}
            {currentLesson?.articleContent && (
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap">
                {currentLesson.articleContent.replace(/!\[.*?\]\(.*?\)\n*/g, '').trim()}
              </div>
            )}

            {/* Content Blocks */}
            {currentLesson?.blocks && currentLesson.blocks.length > 0 && (
              <div className="space-y-6 pt-4">
                {currentLesson.blocks.map((block) => {
                  const isQuizBlock =
                    block.type === 'QUIZ' ||
                    Boolean(block.content?.questions) ||
                    (block.title && block.title.toLowerCase().includes('quiz'));

                  const isImageBlock =
                    block.type === 'IMAGE' ||
                    Boolean(block.content?.url && (block.content?.nodes || block.content?.teachingSteps || block.content?.isCloudinary || block.type === 'IMAGE'));

                  if (isImageBlock) {
                    return (
                      <AIVisualLessonExplainer
                        key={block._id}
                        block={block}
                        lessonTitle={currentLesson?.title}
                        courseId={courseId}
                      />
                    );
                  }

                  return (
                    <Card key={block._id} className="bg-slate-950 border-slate-800 text-slate-200">
                      <CardContent className="p-6 space-y-3">
                        {isQuizBlock ? (
                          <LessonQuizBlock block={block} lessonTitle={currentLesson?.title} />
                        ) : (
                          <>
                            {block.title && <h3 className="font-bold text-white text-base">{block.title}</h3>}
                            {block.type === 'TEXT' && (
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">{block.content?.body}</p>
                            )}
                            {block.type === 'RESOURCE' && (
                              <div className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-800">
                                <span className="text-sm font-medium">{block.title || 'Supplementary File'}</span>
                                <Button size="sm" variant="outline">
                                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                                </Button>
                              </div>
                            )}
                            {block.type === 'EMBED' && (
                              <div className="aspect-video bg-black rounded overflow-hidden">
                                <iframe src={block.content?.body} title={block.title} className="w-full h-full" />
                              </div>
                            )}
                            {block.type === 'AUDIO' && block.content?.url && (
                              <div className="p-3 bg-slate-900 rounded border border-slate-800">
                                <audio controls className="w-full">
                                  <source src={block.content.url} />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Footer Navigation Bar */}
            <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {prevLesson ? (
                  <Link href={`/learn/player/${courseId}/${prevLesson._id}`}>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous Lesson
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleMarkComplete}
                  isLoading={completing}
                  className={isCurrentComplete ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-emerald-600 hover:bg-emerald-500'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isCurrentComplete ? 'Completed (Next)' : 'Mark as Complete & Next'}
                </Button>

                {nextLesson && (
                  <Link href={`/learn/player/${courseId}/${nextLesson._id}`}>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Notes Side Drawer */}
        {notesPanelOpen && (
          <div className="w-80 bg-slate-950 border-l border-slate-800 p-4 flex flex-col shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" /> Lesson Notes
              </h3>
              <button onClick={() => setNotesPanelOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-2 mb-4">
              <textarea
                rows={3}
                placeholder="Take a personal study note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Button size="sm" type="submit" className="w-full text-xs">
                Save Note
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No notes taken for this lesson yet.
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n._id} className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs space-y-1">
                    <p className="text-slate-200">{n.content}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Right Syllabus Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 sm:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Course Syllabus</h3>
                <p className="text-xs text-slate-400">{allLessons.length} lessons total</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {curriculum?.modules?.map((mod, modIdx) => (
                <div key={mod._id} className="p-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Module {modIdx + 1}: {mod.title}
                  </div>
                  <div className="space-y-1">
                    {mod.lessons?.map((les) => {
                      const isSelected = String(les._id) === String(lessonId);
                      const isDone = completedLessonIds.has(les._id);
                      return (
                        <Link
                          key={les._id}
                          href={`/learn/player/${courseId}/${les._id}`}
                          className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                            isSelected
                              ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30'
                              : 'hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isDone ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className="line-clamp-1">{les.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {les.durationMinutes}m
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

