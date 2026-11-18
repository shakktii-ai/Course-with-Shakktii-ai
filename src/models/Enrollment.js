import mongoose from 'mongoose';
import { ENROLLMENT_STATUS, ENROLLMENT_TYPE } from '../constants/index.js';

const enrollmentSchema = new mongoose.Schema(
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
    enrollmentType: {
      type: String,
      enum: Object.values(ENROLLMENT_TYPE),
      default: ENROLLMENT_TYPE.INDIVIDUAL,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.ACTIVE,
      index: true,
    },
    isMandatory: {
      type: Boolean,
      default: false,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index({ tenantId: 1, userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ tenantId: 1, status: 1 });
enrollmentSchema.index({ tenantId: 1, courseId: 1 });

const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
export { Enrollment };


