'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  GraduationCap,
  BookOpen,
  PlayCircle,
  CheckCircle,
  Clock,
  Bookmark,
  FileText,
  History,
  TrendingUp,
  Award,
  Bot,
  Flame,
  Sparkles,
  ArrowRight,
  Scissors,
  Film,
} from 'lucide-react';

function formatVideoDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function LearnerDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [personalAnalytics, setPersonalAnalytics] = useState(null);
  const [videoBreakdowns, setVideoBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [resProg, resAnalytics, resVideos] = await Promise.all([
        fetch('/api/v1/learn/progress'),
        fetch('/api/v1/analytics/learner'),
        fetch('/api/v1/video-clips?limit=6&summary=true'),
      ]);

      const [dataProg, dataAnalytics, dataVideos] = await Promise.all([
        resProg.json().catch(() => ({})),
        resAnalytics.json().catch(() => ({})),
        resVideos.json().catch(() => ({})),
      ]);

      if (dataProg.success) setSummary(dataProg.data);
      if (dataAnalytics.success) setPersonalAnalytics(dataAnalytics.data);
      if (dataVideos.success && Array.isArray(dataVideos.data)) {
        setVideoBreakdowns(dataVideos.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-slate-200 rounded-lg" />
            <div className="h-4 w-80 bg-slate-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-36 bg-slate-200 rounded-lg" />
            <div className="h-9 w-28 bg-slate-200 rounded-lg" />
          </div>
        </div>
        <div className="h-24 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { totalEnrolled, activeCount, completedCount, courses } = summary || {
    totalEnrolled: 0,
    activeCount: 0,
    completedCount: 0,
    courses: [],
  };

  // Find most recently accessed active course for "Continue Learning" banner
  const continueCourse = courses.find((c) => c.status === 'ACTIVE' && c.percentComplete < 100) || courses[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-emerald-600" />
            Learner Workspace
          </h1>
          <p className="text-sm text-slate-500">
            Track your course progress, resume active lessons, and review acquired certifications.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/learn/auto-generate">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
              <Sparkles className="w-4 h-4 mr-1.5 text-emerald-200" />
              <span>Auto-Generate Course</span>
            </Button>
          </Link>
          <Link href="/learn/video-clips">
            <Button variant="outline" size="sm">
              <Scissors className="w-4 h-4 mr-1.5 text-emerald-600" /> Video Clips
            </Button>
          </Link>
          <Link href="/learn/tutor">
            <Button variant="outline" size="sm">
              <Bot className="w-4 h-4 mr-1.5" /> AI Tutor
            </Button>
          </Link>
          <Link href="/learn/courses">
            <Button variant="outline" size="sm">
              <BookOpen className="w-4 h-4 mr-1.5" /> Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Autonomous Student AI Course Studio Banner */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 tracking-tight">
                  Autonomous AI Course & Quiz Studio
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Student Auto-Pilot
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Upload any PDF or document to automatically generate a complete course with verified modular lessons, practical code examples, comprehensive quizzes, and instant enrollment with zero instructor steps.
              </p>
            </div>
          </div>
          <Link href="/learn/auto-generate" className="shrink-0">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2">
              <span>Upload & Auto-Generate</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Highlights Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Enrolled Courses</div>
              <div className="text-xl font-bold text-slate-900">{totalEnrolled}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">In Progress</div>
              <div className="text-xl font-bold text-slate-900">{activeCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Completed Courses</div>
              <div className="text-xl font-bold text-slate-900">{completedCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Day Streak</div>
              <div className="text-xl font-bold text-slate-900">
                {personalAnalytics?.currentStreakDays || 0} Days
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Study Time</div>
              <div className="text-xl font-bold text-slate-900">
                {personalAnalytics?.totalHoursLearned || 0} hrs
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Callout */}
      {continueCourse && continueCourse.course && (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="success">Resume Learning</Badge>
                <span className="text-xs text-slate-500">
                  Last active {continueCourse.lastAccessedAt ? new Date(continueCourse.lastAccessedAt).toLocaleDateString() : 'recently'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{continueCourse.course.title}</h2>
              <div className="w-full max-w-md space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>{continueCourse.percentComplete}% Complete</span>
                  <span>{continueCourse.completedLessons} / {continueCourse.totalLessons} Lessons</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${continueCourse.percentComplete}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <Link
                href={
                  continueCourse.lastAccessedLessonId
                    ? `/learn/player/${continueCourse.course._id}/${continueCourse.lastAccessedLessonId}`
                    : `/learn/courses/${continueCourse.course._id}`
                }
              >
                <Button size="lg" className="shadow-md">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Continue Course
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Video Clip Learning Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-emerald-600" />
              My Video Clip Learning
            </h2>
            <p className="text-xs text-slate-500">
              Resume watching your uploaded videos sliced into AI short clips with explanations and quizzes.
            </p>
          </div>
          <Link
            href="/learn/video-clips"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Open Video Studio &rarr;
          </Link>
        </div>

        {videoBreakdowns.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-slate-50/60">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Turn any lecture video into Short Clips &amp; AI Notes
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload a video once and revisit all its topic clips, explanations, and mini-quizzes right here anytime.
                  </p>
                </div>
              </div>
              <Link href="/learn/video-clips" className="shrink-0">
                <Button size="sm">
                  <Scissors className="w-4 h-4 mr-1.5" /> Upload Video
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoBreakdowns.map((video) => (
              <Card
                key={video._id}
                className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-36 bg-slate-900 border-b border-slate-200 relative overflow-hidden flex items-center justify-center">
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                  ) : (
                    <Film className="w-10 h-10 text-slate-500" />
                  )}
                  <span className="absolute top-2.5 left-2.5">
                    <Badge className="bg-slate-900/80 text-white border-0 backdrop-blur-xs">
                      <Scissors className="w-3 h-3 text-emerald-400" /> {video.clipCount || 0} Clips
                    </Badge>
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 text-white text-xs font-mono">
                    {formatVideoDuration(video.durationSeconds)}
                  </span>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                        AI Video Breakdown
                      </span>
                      <Badge variant="slate">{video.language || 'English'}</Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{video.title}</h3>
                    {video.videoSummary && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {video.videoSummary}
                      </p>
                    )}
                  </div>

                  <Link href={`/learn/video-clips?id=${video._id}`} className="block w-full pt-1">
                    <Button size="sm" className="w-full">
                      <PlayCircle className="w-4 h-4 mr-1.5" />
                      Continue Video Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Enrolled Courses Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">My Enrolled Courses</h2>
          <Link href="/learn/courses" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Browse All Courses &rarr;
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-slate-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="font-semibold text-slate-800 text-base">You are not enrolled in any courses</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Explore the academy course catalog to discover and begin learning today.
              </p>
              <Link href="/learn/courses">
                <Button className="mt-4">
                  <BookOpen className="w-4 h-4 mr-1.5" /> Explore Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((item) => {
              const c = item.course;
              if (!c) return null;
              return (
                <Card key={item.enrollmentId} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-40 bg-slate-100 border-b border-slate-200 relative overflow-hidden flex items-center justify-center">
                    {c.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-12 h-12 text-slate-300" />
                    )}
                    <span className="absolute top-3 right-3">
                      <Badge variant={item.percentComplete === 100 ? 'success' : 'neutral'}>
                        {item.percentComplete === 100 ? 'Completed' : `${item.percentComplete}%`}
                      </Badge>
                    </span>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                        {c.difficulty || 'GENERAL'}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-2">{c.title}</h3>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${item.percentComplete}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {c.durationHours}h
                        </span>
                        <span>{item.completedLessons} / {item.totalLessons} Lessons</span>
                      </div>

                      <Link
                        href={
                          item.lastAccessedLessonId
                            ? `/learn/player/${c._id}/${item.lastAccessedLessonId}`
                            : `/learn/courses/${c._id}`
                        }
                        className="block w-full"
                      >
                        <Button variant={item.percentComplete === 100 ? 'outline' : 'default'} className="w-full">
                          <PlayCircle className="w-4 h-4 mr-1.5" />
                          {item.percentComplete === 100 ? 'Review Course' : 'Continue'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

