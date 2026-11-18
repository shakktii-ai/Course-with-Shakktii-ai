import mongoose from 'mongoose';
import { TUTOR_MODE, TUTOR_CONTEXT_SCOPE } from '../constants/index.js';

const tutorConversationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    academyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Academy',
      default: null,
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
      default: null,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    title: {
      type: String,
      default: 'New Learning Session',
      trim: true,
      maxlength: 200,
    },
    contextScope: {
      type: String,
      enum: Object.values(TUTOR_CONTEXT_SCOPE),
      default: TUTOR_CONTEXT_SCOPE.COURSE,
    },
    mode: {
      type: String,
      enum: Object.values(TUTOR_MODE),
      default: TUTOR_MODE.TUTOR,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    tokenUsage: {
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

tutorConversationSchema.index({ tenantId: 1, userId: 1, status: 1 });
tutorConversationSchema.index({ tenantId: 1, courseId: 1 });

const TutorConversation =
  mongoose.models.TutorConversation ||
  mongoose.model('TutorConversation', tutorConversationSchema);

export default TutorConversation;
export { TutorConversation };

