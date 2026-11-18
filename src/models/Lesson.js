import mongoose from 'mongoose';
import { LESSON_TYPE } from '../constants/index.js';

const lessonSchema = new mongoose.Schema(
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
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(LESSON_TYPE),
      default: LESSON_TYPE.ARTICLE,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 5,
      min: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    videoDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    articleContent: {
      type: String,
      default: '',
    },
    blockCount: {
      type: Number,
      default: 0,
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

lessonSchema.index({ tenantId: 1, moduleId: 1, order: 1 });
lessonSchema.index({ tenantId: 1, courseId: 1 });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);

export default Lesson;
export { Lesson };


