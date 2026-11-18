import mongoose from 'mongoose';
import { ATTEMPT_STATUS } from '../constants/index.js';

const assessmentAttemptSchema = new mongoose.Schema(
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
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: Object.values(ATTEMPT_STATUS),
      default: ATTEMPT_STATUS.IN_PROGRESS,
      index: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AssessmentQuestion',
          required: true,
        },
        selectedOptionIds: [{ type: String }],
        textAnswer: { type: String, default: '' },
        codeAnswer: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
        pointsAwarded: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
      },
    ],
    scorePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
    },
    totalPointsPossible: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
      index: true,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index({ tenantId: 1, userId: 1, assessmentId: 1 });
assessmentAttemptSchema.index({ tenantId: 1, assessmentId: 1, status: 1 });
assessmentAttemptSchema.index({ tenantId: 1, courseId: 1, userId: 1 });
assessmentAttemptSchema.index({ tenantId: 1, createdAt: -1 });

const AssessmentAttempt =
  mongoose.models.AssessmentAttempt ||
  mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

export default AssessmentAttempt;
export { AssessmentAttempt };

