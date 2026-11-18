import mongoose from 'mongoose';
import { PROGRESS_STATUS } from '../constants/index.js';

const lessonProgressSchema = new mongoose.Schema(
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
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PROGRESS_STATUS),
      default: PROGRESS_STATUS.NOT_STARTED,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    videoPlaybackPosition: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

lessonProgressSchema.index({ tenantId: 1, userId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ tenantId: 1, userId: 1, courseId: 1 });

const LessonProgress = mongoose.models.LessonProgress || mongoose.model('LessonProgress', lessonProgressSchema);

export default LessonProgress;
export { LessonProgress };


