import mongoose from 'mongoose';
import { JOB_STATUS, AI_TASK_TYPE, AI_PROVIDER } from '../constants/index.js';

const aiGenerationJobSchema = new mongoose.Schema(
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
    taskType: {
      type: String,
      enum: Object.values(AI_TASK_TYPE),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.QUEUED,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    brief: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sourceDocumentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SourceDocument',
      },
    ],
    generatedCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    resultData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: String,
      default: '',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    provider: {
      type: String,
      default: AI_PROVIDER.GEMINI,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

aiGenerationJobSchema.index({ tenantId: 1, status: 1 });
aiGenerationJobSchema.index({ tenantId: 1, userId: 1 });

const AIGenerationJob = mongoose.models.AIGenerationJob || mongoose.model('AIGenerationJob', aiGenerationJobSchema);

export default AIGenerationJob;

