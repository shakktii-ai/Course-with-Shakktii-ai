import mongoose from 'mongoose';
import { JOB_STATUS } from '../constants/index.js';

const documentProcessingJobSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SourceDocument',
      required: true,
      index: true,
    },
    jobId: {
      type: String,
      default: '',
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
    step: {
      type: String,
      default: 'INIT',
    },
    error: {
      type: String,
      default: '',
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

documentProcessingJobSchema.index({ tenantId: 1, documentId: 1 });
documentProcessingJobSchema.index({ tenantId: 1, status: 1 });

const DocumentProcessingJob = mongoose.models.DocumentProcessingJob || mongoose.model('DocumentProcessingJob', documentProcessingJobSchema);

export default DocumentProcessingJob;

