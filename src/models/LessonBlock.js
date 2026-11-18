import mongoose from 'mongoose';
import { BLOCK_TYPE } from '../constants/index.js';

const lessonBlockSchema = new mongoose.Schema(
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
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(BLOCK_TYPE),
      required: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isOptional: {
      type: Boolean,
      default: false,
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

lessonBlockSchema.index({ tenantId: 1, lessonId: 1, order: 1 });
lessonBlockSchema.index({ tenantId: 1, courseId: 1 });

const LessonBlock = mongoose.models.LessonBlock || mongoose.model('LessonBlock', lessonBlockSchema);

export default LessonBlock;
export { LessonBlock };


