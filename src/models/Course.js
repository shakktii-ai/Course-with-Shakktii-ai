import mongoose from 'mongoose';
import { COURSE_STATUS, DIFFICULTY_LEVEL, COURSE_VISIBILITY } from '../constants/index.js';

const courseSchema = new mongoose.Schema(
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
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    headline: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseCategory',
      default: null,
      index: true,
    },
    difficulty: {
      type: String,
      enum: Object.values(DIFFICULTY_LEVEL),
      default: DIFFICULTY_LEVEL.BEGINNER,
      index: true,
    },
    visibility: {
      type: String,
      enum: Object.values(COURSE_VISIBILITY),
      default: COURSE_VISIBILITY.PUBLIC,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      default: COURSE_STATUS.DRAFT,
      index: true,
    },
    durationHours: {
      type: Number,
      default: 1,
      min: 0,
    },
    objectives: {
      type: [String],
      default: [],
    },
    targetAudience: {
      type: [String],
      default: [],
    },
    prerequisitesText: {
      type: [String],
      default: [],
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    publishedVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseVersion',
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    scheduledPublishDate: {
      type: Date,
      default: null,
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

courseSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
courseSchema.index({ tenantId: 1, status: 1, visibility: 1 });
courseSchema.index({ tenantId: 1, categoryId: 1 });
courseSchema.index({ tenantId: 1, instructorId: 1 });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;
export { Course };


