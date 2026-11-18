import AIReview from '../models/AIReview.js';
import AIReviewComment from '../models/AIReviewComment.js';
import Course from '../models/Course.js';
import SourceReference from '../models/SourceReference.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { AI_REVIEW_STATUS, COURSE_STATUS } from '../constants/index.js';

export class AIReviewService extends BaseService {
  constructor() {
    super(AIReview);
  }

  static async getReviews(tenantId, filters = {}) {
    const query = { tenantId };
    if (filters.status) query.status = filters.status;

    return await AIReview.find(query)
      .populate('courseId', 'title slug difficulty status headline durationHours')
      .populate('reviewerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getReviewById(tenantId, reviewId) {
    const review = await AIReview.findOne({ _id: reviewId, tenantId })
      .populate('courseId')
      .populate('reviewerId', 'name email')
      .lean();

    if (!review) {
      throw new NotFoundError('AI Review record not found');
    }

    // Fetch associated citations and comments
    const [citations, comments] = await Promise.all([
      SourceReference.find({ tenantId, courseId: review.courseId?._id }).lean(),
      AIReviewComment.find({ tenantId, reviewId }).populate('authorId', 'name email').sort({ createdAt: 1 }).lean(),
    ]);

    return {
      review,
      citations,
      comments,
    };
  }

  static async approveReview(tenantId, reviewId, userId) {
    const review = await AIReview.findOne({ _id: reviewId, tenantId });
    if (!review) {
      throw new NotFoundError('AI Review record not found');
    }

    review.status = AI_REVIEW_STATUS.APPROVED;
    review.reviewerId = userId;
    review.approvedAt = new Date();
    await review.save();

    // Mark Course as APPROVED or PUBLISHED
    if (review.courseId) {
      await Course.updateOne(
        { _id: review.courseId, tenantId },
        { $set: { status: COURSE_STATUS.APPROVED, updatedBy: userId } }
      );
    }

    return {
      success: true,
      review,
      message: 'AI generated course approved successfully',
    };
  }

  static async rejectReview(tenantId, reviewId, reason = 'Needs revisions', userId) {
    const review = await AIReview.findOne({ _id: reviewId, tenantId });
    if (!review) {
      throw new NotFoundError('AI Review record not found');
    }

    review.status = AI_REVIEW_STATUS.REJECTED;
    review.reviewerId = userId;
    review.rejectedAt = new Date();
    review.reviewNotes = reason;
    await review.save();

    if (review.courseId) {
      await Course.updateOne(
        { _id: review.courseId, tenantId },
        { $set: { status: COURSE_STATUS.DRAFT, updatedBy: userId } }
      );
    }

    return {
      success: true,
      review,
      message: 'AI generated course rejected and marked for revision',
    };
  }

  static async addComment(tenantId, reviewId, { lessonId = null, comment }, userId) {
    if (!comment || !comment.trim()) {
      throw new BadRequestError('Comment is required');
    }

    const review = await AIReview.findOne({ _id: reviewId, tenantId });
    if (!review) {
      throw new NotFoundError('AI Review record not found');
    }

    return await AIReviewComment.create({
      tenantId,
      reviewId,
      lessonId: lessonId || null,
      authorId: userId,
      comment: comment.trim(),
    });
  }
}

