import mongoose from 'mongoose';
import { JOB_STATUS, RENDERING_STEP } from '../constants/index.js';

const videoRenderingJobSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoProject',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.QUEUED,
      index: true,
    },
    currentStep: {
      type: String,
      enum: Object.values(RENDERING_STEP),
      default: RENDERING_STEP.INITIALIZING,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stepLogs: [
      {
        step: { type: String, required: true },
        status: { type: String, default: 'COMPLETED' },
        message: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    outputVideoUrl: {
      type: String,
      default: '',
    },
    hlsManifestUrl: {
      type: String,
      default: '',
    },
    subtitlesUrl: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
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

videoRenderingJobSchema.index({ tenantId: 1, status: 1 });
videoRenderingJobSchema.index({ tenantId: 1, projectId: 1 });

const VideoRenderingJob = mongoose.models.VideoRenderingJob || mongoose.model('VideoRenderingJob', videoRenderingJobSchema);

export default VideoRenderingJob;
export { VideoRenderingJob };

