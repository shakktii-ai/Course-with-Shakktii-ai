'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  ArrowLeft,
  Edit,
  Play,
  CheckCircle,
  Archive,
  Clock,
  Users,
  Layers,
  History,
  FileText,
  Video,
  ListOrdered,
  PlusCircle,
} from 'lucide-react';

export default function CourseOverviewPage({ params }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;

  const [courseData, setCourseData] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCourse, resVersions] = await Promise.all([
        fetch(`/api/v1/courses/${courseId}?full=true`),
        fetch(`/api/v1/courses/${courseId}/versions`),
      ]);

      const [dataCourse, dataVersions] = await Promise.all([
        resCourse.json(),
        resVersions.json(),
      ]);

      if (dataCourse.success) {
        setCourseData(dataCourse.data);
      }
      if (dataVersions.success) {
        setVersions(dataVersions.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchCourseData();
      } else {
        alert(data.error?.message || 'Failed to publish course');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/archive`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchCourseData();
      } else {
        alert(data.error?.message || 'Failed to archive course');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading course overview and curriculum...
      </div>
    );
  }

  if (!courseData || !courseData.course) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Course Not Found</h2>
        <Link href="/admin/courses">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
          </Button>
        </Link>
      </div>
    );
  }

  const { course, modules } = courseData;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral">Archived</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/courses" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Courses
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              {getStatusBadge(course.status)}
            </div>
            <p className="text-sm text-slate-500">{course.headline || 'No summary provided'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/courses/${course._id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2 text-emerald-600" />
                Curriculum Studio
              </Button>
            </Link>

            {modules.length > 0 && modules[0]?.lessons?.length > 0 && (
              <Link href={`/learn/player/${course._id}/${modules[0].lessons[0]._id}`}>
                <Button variant="outline">
                  <Play className="w-4 h-4 mr-2 text-blue-600" />
                  Preview Player
                </Button>
              </Link>
            )}

            {course.status !== 'PUBLISHED' && (
              <Button onClick={handlePublish} loading={actionLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Publish Course
              </Button>
            )}

            {course.status === 'PUBLISHED' && (
              <Button variant="outline" onClick={handleArchive} loading={actionLoading}>
                <Archive className="w-4 h-4 mr-2 text-amber-600" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Meta Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Duration</div>
              <div className="text-base font-bold text-slate-900">{course.durationHours} Hours</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Structure</div>
              <div className="text-base font-bold text-slate-900">
                {modules.length} Modules / {courseData.totalLessons || 0} Lessons
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Enrolled</div>
              <div className="text-base font-bold text-slate-900">{course.enrollmentCount || 0} Learners</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Version</div>
              <div className="text-base font-bold text-slate-900">v{course.currentVersion || 1}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Curriculum Syllabus Tree */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Curriculum Syllabus</CardTitle>
                <CardDescription>Structured hierarchy of modules, lessons, and content units.</CardDescription>
              </div>
              <Link href={`/admin/courses/${course._id}/edit`}>
                <Button size="sm" variant="outline">
                  <PlusCircle className="w-4 h-4 mr-1" /> Add Content
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {modules.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No modules added yet.</p>
                  <Link href={`/admin/courses/${course._id}/edit`}>
                    <Button size="sm" className="mt-3">
                      Open Curriculum Studio
                    </Button>
                  </Link>
                </div>
              ) : (
                modules.map((mod, modIdx) => (
                  <div key={mod._id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-3 bg-slate-50 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                          {modIdx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 text-sm">{mod.title}</span>
                      </div>
                      <span className="text-xs text-slate-500">{mod.lessons?.length || 0} Lessons</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {mod.lessons?.map((les, lesIdx) => (
                        <div key={les._id} className="p-3 pl-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            {les.type === 'VIDEO' ? (
                              <Video className="w-4 h-4 text-purple-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-emerald-600" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-slate-900">{les.title}</div>
                              <div className="text-xs text-slate-400">
                                {les.durationMinutes} mins {les.isPreview ? '• Free Preview' : ''}
                              </div>
                            </div>
                          </div>
                          <Link href={`/learn/player/${course._id}/${les._id}`}>
                            <Button variant="ghost" size="sm">
                              <Play className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Description, Objectives & Versions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">Difficulty:</span> {course.difficulty}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Visibility:</span> {course.visibility}
              </div>
              {course.description && (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Description:</span>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {course.objectives && course.objectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
              <CardTitle>Version History ({versions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {versions.length === 0 ? (
                <p className="text-xs text-slate-400">No published versions yet. This course is in draft.</p>
              ) : (
                versions.map((ver) => (
                  <div key={ver._id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{ver.title}</span>
                      <span className="text-emerald-700 font-bold">{ver.status}</span>
                    </div>
                    <div className="text-slate-500">{ver.changelog}</div>
                    <div className="text-slate-400">{new Date(ver.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

