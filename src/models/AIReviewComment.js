import mongoose from 'mongoose';

const aiReviewCommentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIReview',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

aiReviewCommentSchema.index({ tenantId: 1, reviewId: 1 });

const AIReviewComment = mongoose.models.AIReviewComment || mongoose.model('AIReviewComment', aiReviewCommentSchema);

export default AIReviewComment;

