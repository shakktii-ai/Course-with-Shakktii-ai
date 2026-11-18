'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Users,
  PlayCircle,
  GraduationCap,
  CheckCircle,
  Star,
} from 'lucide-react';

export default function LearnerCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'PUBLISHED' });
      if (search) params.set('search', search);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);

      const [resCourses, resCats, resEnr] = await Promise.all([
        fetch(`/api/v1/courses?${params.toString()}`),
        fetch('/api/v1/categories'),
        fetch('/api/v1/enrollments'),
      ]);

      const [dataCourses, dataCats, dataEnr] = await Promise.all([
        resCourses.json(),
        resCats.json(),
        resEnr.json(),
      ]);

      if (dataCourses.success) setCourses(dataCourses.data.items || []);
      if (dataCats.success) setCategories(dataCats.data || []);
      if (dataEnr.success) {
        const enrolledIds = new Set((dataEnr.data.items || []).map((e) => e.courseId?._id).filter(Boolean));
        setEnrolledCourseIds(enrolledIds);
      }
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedDifficulty]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      const res = await fetch('/api/v1/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.success) {
        setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
        fetchCatalog();
      } else {
        alert(data.error?.message || 'Enrollment failed');
      }
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-emerald-600" />
          Course Catalog
        </h1>
        <p className="text-sm text-slate-500">
          Discover comprehensive courses, acquire new industry competencies, and self-enroll.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Search courses by keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Difficulty Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          Loading catalog courses...
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold text-slate-800 text-base">No published courses found</h3>
            <p className="text-sm text-slate-400 mt-1">
              Check back soon or try adjusting your search filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id);
            return (
              <Card key={course._id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-44 bg-slate-100 border-b border-slate-200 relative overflow-hidden flex items-center justify-center">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  )}
                  {course.categoryId && (
                    <span className="absolute top-3 left-3">
                      <span
                        className="px-2.5 py-1 rounded text-xs font-semibold text-white shadow-sm"
                        style={{ backgroundColor: course.categoryId.color || '#059669' }}
                      >
                        {course.categoryId.name}
                      </span>
                    </span>
                  )}
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{course.difficulty}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {course.durationHours} Hours
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{course.headline || course.description}</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {course.enrollmentCount || 0} Learners
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/learn/courses/${course._id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          Details
                        </Button>
                      </Link>

                      {isEnrolled ? (
                        <Link href={`/learn/courses/${course._id}`} className="w-full">
                          <Button className="w-full">
                            <PlayCircle className="w-4 h-4 mr-1.5" /> Start
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="w-full"
                          loading={enrollingId === course._id}
                          onClick={() => handleEnroll(course._id)}
                        >
                          Enroll Free
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

