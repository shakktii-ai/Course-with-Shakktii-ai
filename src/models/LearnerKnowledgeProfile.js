import mongoose from 'mongoose';
import { LEARNING_STYLE } from '../constants/index.js';

const remediationHistorySchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
      default: null,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    topic: {
      type: String,
      default: '',
    },
    recommendedActions: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const learnerKnowledgeProfileSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    masteryLevel: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    learningStyle: {
      type: String,
      enum: Object.values(LEARNING_STYLE),
      default: LEARNING_STYLE.CONCEPTUAL,
    },
    weakConcepts: {
      type: [String],
      default: [],
    },
    strongConcepts: {
      type: [String],
      default: [],
    },
    remediationHistory: {
      type: [remediationHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

learnerKnowledgeProfileSchema.index({ tenantId: 1, userId: 1, courseId: 1 }, { unique: true });

const LearnerKnowledgeProfile =
  mongoose.models.LearnerKnowledgeProfile ||
  mongoose.model('LearnerKnowledgeProfile', learnerKnowledgeProfileSchema);

export default LearnerKnowledgeProfile;
export { LearnerKnowledgeProfile };

