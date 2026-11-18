import mongoose from 'mongoose';
import { AI_REVIEW_STATUS } from '../constants/index.js';

const aiReviewSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIGenerationJob',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(AI_REVIEW_STATUS),
      default: AI_REVIEW_STATUS.PENDING_REVIEW,
      index: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    citationCount: {
      type: Number,
      default: 0,
    },
    verifiedCitationsCount: {
      type: Number,
      default: 0,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

aiReviewSchema.index({ tenantId: 1, courseId: 1 });
aiReviewSchema.index({ tenantId: 1, status: 1 });

const AIReview = mongoose.models.AIReview || mongoose.model('AIReview', aiReviewSchema);

export { AIReview };
export default AIReview;


