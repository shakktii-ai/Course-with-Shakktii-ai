'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Label } from '@/components/ui/Input';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
  FileText,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

function ReviewWorkflowContent() {
  const searchParams = useSearchParams();
  const queryReviewId = searchParams.get('reviewId');

  const [reviews, setReviews] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState(queryReviewId || null);
  const [reviewDetail, setReviewDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Comment Box
  const [newComment, setNewComment] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/reviews');
      const data = await res.json();
      if (data.success) {
        const list = data.data || [];
        setReviews(list);
        if (!selectedReviewId && list.length > 0) {
          setSelectedReviewId(list[0]._id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedReviewId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const fetchReviewDetail = useCallback(async () => {
    if (!selectedReviewId) return;
    try {
      const res = await fetch(`/api/v1/ai/reviews/${selectedReviewId}`);
      const data = await res.json();
      if (data.success) {
        setReviewDetail(data.data);
      }
    } catch (err) {
      console.error('Error loading review detail:', err);
    }
  }, [selectedReviewId]);

  useEffect(() => {
    fetchReviewDetail();
  }, [fetchReviewDetail]);

  const handleApprove = async () => {
    if (!selectedReviewId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/ai/reviews/${selectedReviewId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert('Course successfully approved and published to LMS!');
        fetchReviews();
        fetchReviewDetail();
      } else {
        alert(data.error?.message || 'Approval failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReviewId || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/ai/reviews/${selectedReviewId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setRejectModalOpen(false);
        setRejectReason('');
        alert('Course marked for revision with feedback.');
        fetchReviews();
        fetchReviewDetail();
      } else {
        alert(data.error?.message || 'Rejection failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedReviewId) return;

    try {
      const res = await fetch('/api/v1/ai/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReviewId,
          comment: newComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        fetchReviewDetail();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const activeReview = reviewDetail?.review;
  const citations = reviewDetail?.citations || [];
  const comments = reviewDetail?.comments || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/studio" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            AI Studio
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
          AI Reviewer & Verification Center
        </h1>
        <p className="text-sm text-slate-500">
          Verify source grounding, audit citations against uploaded documents, and approve courses for LMS publication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Review Queue List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Review Queue ({reviews.length})
          </div>
          <div className="space-y-2">
            {reviews.map((r) => (
              <div
                key={r._id}
                onClick={() => setSelectedReviewId(r._id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedReviewId === r._id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-semibold truncate">{r.courseId?.title || 'Course'}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <Badge variant={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'outline'}>
                    {r.status}
                  </Badge>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center / Right Column: Active Review & Citations */}
        <div className="lg:col-span-3 space-y-6">
          {!activeReview ? (
            <Card>
              <CardContent className="py-20 text-center text-slate-400">
                Select a course from the review queue to inspect citations and approve.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header Card */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">{activeReview.courseId?.title}</CardTitle>
                      <Badge variant={activeReview.status === 'APPROVED' ? 'success' : 'warning'}>
                        {activeReview.status}
                      </Badge>
                    </div>
                    <CardDescription>{activeReview.reviewNotes || 'AI Generated content pending human review.'}</CardDescription>
                  </div>

                  {activeReview.status !== 'APPROVED' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setRejectModalOpen(true)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Request Changes
                      </Button>
                      <Button onClick={handleApprove} loading={actionLoading}>
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Approve & Publish
                      </Button>
                    </div>
                  )}
                </CardHeader>
              </Card>

              {/* Source Grounding & Citations Audit */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      Source Grounding Citations ({citations.length})
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      Verified Citations: {activeReview.verifiedCitationsCount || 0}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Every highlighted claim or concept mapped directly back to uploaded source document chunks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {citations.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No explicit citations recorded for this generation.
                    </div>
                  ) : (
                    citations.map((cit, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            Source: {cit.documentName} (Page {cit.pageNumber || 1})
                          </span>
                          <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                            {cit.isVerified ? 'VERIFIED CLAIM' : 'UNVERIFIED'}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200 text-slate-600 italic">
                          &ldquo;{cit.sourcePassage}&rdquo;
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Review Comments Thread */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Reviewer Notes & Feedback Thread ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {comments.map((c) => (
                      <div key={c._id} className="p-3 bg-slate-50 rounded border text-xs space-y-1">
                        <div className="flex justify-between text-slate-500">
                          <span className="font-bold text-slate-800">{c.authorId?.name || 'Reviewer'}</span>
                          <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-700">{c.comment}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <Input
                      placeholder="Add an editorial comment or correction request..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button type="submit" size="sm">
                      Post Note
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* REJECT / REQUEST CHANGES MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Request Revisions / Reject Course"
        description="Provide feedback to the course creator explaining what sections require rework."
      >
        <div className="space-y-4">
          <div>
            <Label required>Reason for Revision</Label>
            <textarea
              rows={4}
              placeholder="e.g. Module 2 needs more practical examples on distributed tracing..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} loading={actionLoading}>
            Submit Feedback & Reject
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default function AIReviewWorkflowPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading review...</div>}>
      <ReviewWorkflowContent />
    </Suspense>
  );
}

