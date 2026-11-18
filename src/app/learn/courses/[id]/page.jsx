'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  ArrowLeft,
  Clock,
  Users,
  PlayCircle,
  CheckCircle,
  FileText,
  Video,
  Star,
  Layers,
  ChevronDown,
  Headphones,
} from 'lucide-react';

export default function LearnerCourseOverviewPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;

  const [courseData, setCourseData] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCourse, resEnr, resProg] = await Promise.all([
        fetch(`/api/v1/courses/${courseId}?full=true`),
        fetch('/api/v1/enrollments'),
        fetch(`/api/v1/learn/progress?courseId=${courseId}`),
      ]);

      const [dataCourse, dataEnr, dataProg] = await Promise.all([
        resCourse.json(),
        resEnr.json(),
        resProg.json(),
      ]);

      if (dataCourse.success) setCourseData(dataCourse.data);
      if (dataEnr.success) {
        const found = (dataEnr.data.items || []).some((e) => String(e.courseId?._id) === String(courseId));
        setIsEnrolled(found);
      }
      if (dataProg.success) {
        setProgress(dataProg.data.progress);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch('/api/v1/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEnrolled(true);
        // If course has lessons, go directly to first lesson
        const firstLesson = courseData?.modules?.[0]?.lessons?.[0];
        if (firstLesson) {
          router.push(`/learn/player/${courseId}/${firstLesson._id}`);
        } else {
          fetchCourseData();
        }
      } else {
        alert(data.error?.message || 'Enrollment failed');
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading course overview...
      </div>
    );
  }

  if (!courseData || !courseData.course) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Course Not Found</h2>
        <Link href="/learn/courses">
          <Button variant="outline">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const { course, modules } = courseData;
  const firstLessonId = modules?.[0]?.lessons?.[0]?._id;
  const resumeLessonId = progress?.lastAccessedLessonId || firstLessonId;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <Link href="/learn/courses" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Course Catalog
        </Link>
      </div>

      {/* Main Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            {course.categoryId && (
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-xs border border-emerald-500/30">
                {course.categoryId.name}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">
              {course.difficulty}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{course.title}</h1>
          <p className="text-base text-slate-300 leading-relaxed">{course.headline || course.description}</p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" /> {course.durationHours} Hours Total
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" /> {modules.length} Modules / {courseData.totalLessons || 0} Lessons
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <Headphones className="w-4 h-4 text-emerald-400" /> AI Voice Narration
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.9 Rating
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" /> {course.enrollmentCount || 0} Students
            </span>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            {isEnrolled ? (
              <>
                <Link href={`/learn/player/${course._id}/${resumeLessonId}`}>
                  <Button size="lg" className="shadow-lg">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    {progress?.percentComplete > 0 ? `Resume (${progress.percentComplete}%)` : 'Start Learning'}
                  </Button>
                </Link>
                <Link href={`/learn/player/${course._id}/${resumeLessonId}`}>
                  <Button size="lg" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                    <Headphones className="w-5 h-5 mr-2 text-emerald-400" />
                    Listen in Voice Mode
                  </Button>
                </Link>
              </>
            ) : (
              <Button size="lg" onClick={handleEnroll} isLoading={enrolling} className="shadow-lg">
                Enroll In Course — Free
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Syllabus Structure */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Syllabus & Modules</CardTitle>
              <CardDescription>
                {modules.length} modules • {courseData.totalLessons || 0} lessons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {modules.map((mod, modIdx) => (
                <div key={mod._id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="p-3 bg-slate-50 flex items-center justify-between border-b border-slate-200">
                    <span className="font-semibold text-slate-800 text-sm">
                      Module {modIdx + 1}: {mod.title}
                    </span>
                    <span className="text-xs text-slate-500">{mod.lessons?.length || 0} Lessons</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {mod.lessons?.map((les, lesIdx) => (
                      <div key={les._id} className="p-3 pl-6 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          {les.type === 'VIDEO' ? (
                            <Video className="w-4 h-4 text-purple-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-emerald-600" />
                          )}
                          <span className="text-sm text-slate-800">{les.title}</span>
                          {les.isPreview && <Badge variant="outline">Preview</Badge>}
                        </div>

                        {les.isPreview && !isEnrolled && (
                          <Link href={`/learn/player/${course._id}/${les._id}`}>
                            <span className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer">
                              Preview &rarr;
                            </span>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Objectives */}
        <div className="space-y-6">
          {course.objectives && course.objectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What You Will Learn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {course.objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {course.description || 'No detailed overview provided.'}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

