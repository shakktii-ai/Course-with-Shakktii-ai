import mongoose from 'mongoose';
import { PROGRESS_STATUS } from '../constants/index.js';

const courseProgressSchema = new mongoose.Schema(
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
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    percentComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: Object.values(PROGRESS_STATUS),
      default: PROGRESS_STATUS.NOT_STARTED,
      index: true,
    },
    lastAccessedLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    totalTimeSpentSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

courseProgressSchema.index({ tenantId: 1, userId: 1, courseId: 1 }, { unique: true });
courseProgressSchema.index({ tenantId: 1, status: 1 });

const CourseProgress = mongoose.models.CourseProgress || mongoose.model('CourseProgress', courseProgressSchema);

export default CourseProgress;
export { CourseProgress };


