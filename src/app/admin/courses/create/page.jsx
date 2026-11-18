'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  X,
  Sparkles,
  Layers,
  Clock,
  Target,
} from 'lucide-react';

export default function CreateCoursePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [durationHours, setDurationHours] = useState('2');
  const [thumbnail, setThumbnail] = useState('');

  // Objectives array
  const [objectives, setObjectives] = useState(['']);
  const [objectiveInput, setObjectiveInput] = useState('');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/v1/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadCategories();
  }, []);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setObjectives([...objectives.filter(Boolean), objectiveInput.trim()]);
      setObjectiveInput('');
    }
  };

  const removeObjective = (index) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Course title is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        headline: headline.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        difficulty,
        visibility,
        durationHours: parseFloat(durationHours) || 1,
        thumbnail: thumbnail.trim() || undefined,
        objectives: objectives.filter(Boolean),
      };

      const res = await fetch('/api/v1/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create course');
      }

      // Redirect directly to Curriculum Builder Studio
      router.push(`/admin/courses/${data.data._id}/edit`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/courses" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Courses
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-emerald-600" />
          Create New Course
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up core course metadata, syllabus objectives, and launch the Curriculum Builder.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General identity and discovery details for the course.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label required>Course Title</Label>
              <Input
                placeholder="e.g. Modern Full-Stack Web Architecture"
                value={title}
                onChange={handleTitleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>URL Slug</Label>
                <Input
                  placeholder="e.g. modern-full-stack-architecture"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select a Category...</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Headline / Short Tagline</Label>
              <Input
                placeholder="A concise one-line summary of what learners will master"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                rows={4}
                placeholder="Provide a comprehensive syllabus overview, course scope, and background..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <Label>Thumbnail Image URL</Label>
              <Input
                placeholder="https://images.unsplash.com/photo-..."
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Configuration & Access</CardTitle>
            <CardDescription>Determine difficulty level, expected duration, and visibility scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Difficulty Level</Label>
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

              <div>
                <Label>Visibility Scope</Label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PUBLIC">Public (All Academy Members)</option>
                  <option value="PRIVATE">Private (Assigned Only)</option>
                  <option value="RESTRICTED">Restricted (Department Only)</option>
                </select>
              </div>

              <div>
                <Label>Estimated Duration (Hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Objectives</CardTitle>
            <CardDescription>What key competencies and skills will learners acquire?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Design multi-tenant distributed databases"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addObjective();
                  }
                }}
              />
              <Button type="button" onClick={addObjective} variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {objectives.filter(Boolean).map((obj, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{obj}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeObjective(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/courses">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Create & Open Curriculum Builder
          </Button>
        </div>
      </form>
    </div>
  );
}

