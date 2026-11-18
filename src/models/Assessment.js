import mongoose from 'mongoose';
import { ASSESSMENT_TYPE, ASSESSMENT_STATUS } from '../constants/index.js';

const assessmentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
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
    type: {
      type: String,
      enum: Object.values(ASSESSMENT_TYPE),
      default: ASSESSMENT_TYPE.QUIZ,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ASSESSMENT_STATUS),
      default: ASSESSMENT_STATUS.DRAFT,
      index: true,
    },
    passingScorePercentage: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    timeLimitMinutes: {
      type: Number,
      default: 0, // 0 = untimed
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    showCorrectAnswers: {
      type: String,
      enum: ['IMMEDIATE', 'AFTER_PASSING', 'NEVER'],
      default: 'IMMEDIATE',
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    questionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ tenantId: 1, status: 1 });
assessmentSchema.index({ tenantId: 1, courseId: 1 });
assessmentSchema.index({ tenantId: 1, lessonId: 1 });
assessmentSchema.index({ tenantId: 1, createdAt: -1 });

const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);

export default Assessment;
export { Assessment };

