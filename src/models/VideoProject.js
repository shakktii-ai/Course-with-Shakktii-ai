import mongoose from 'mongoose';
import { VIDEO_STATUS, VIDEO_ASPECT_RATIO, VIDEO_RESOLUTION } from '../constants/index.js';

const videoProjectSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(VIDEO_STATUS),
      default: VIDEO_STATUS.DRAFT,
      index: true,
    },
    aspectRatio: {
      type: String,
      enum: Object.values(VIDEO_ASPECT_RATIO),
      default: VIDEO_ASPECT_RATIO.LANDSCAPE_16_9,
    },
    resolution: {
      type: String,
      enum: Object.values(VIDEO_RESOLUTION),
      default: VIDEO_RESOLUTION.RES_1080P,
    },
    theme: {
      primaryColor: { type: String, default: '#059669' },
      backgroundColor: { type: String, default: '#0f172a' },
      textColor: { type: String, default: '#ffffff' },
      fontFamily: { type: String, default: 'Inter' },
      template: { type: String, default: 'modern-enterprise' },
    },
    voiceConfig: {
      voiceId: { type: String, default: 'en-US-JennyNeural' },
      provider: { type: String, default: 'MOCK' },
      language: { type: String, default: 'en' },
      speedRate: { type: Number, default: 1.0 },
      pitch: { type: Number, default: 1.0 },
    },
    avatarConfig: {
      enabled: { type: Boolean, default: true },
      avatarId: { type: String, default: 'prof-clara' },
      style: { type: String, default: 'professional' },
      position: {
        type: String,
        enum: ['bottom-right', 'full-screen', 'left-split', 'none'],
        default: 'bottom-right',
      },
    },
    scenesCount: {
      type: Number,
      default: 0,
    },
    totalDurationSeconds: {
      type: Number,
      default: 0,
    },
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
    renderingJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoRenderingJob',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

videoProjectSchema.index({ tenantId: 1, status: 1 });
videoProjectSchema.index({ tenantId: 1, courseId: 1 });
videoProjectSchema.index({ tenantId: 1, lessonId: 1 });
videoProjectSchema.index({ tenantId: 1, createdAt: -1 });

const VideoProject = mongoose.models.VideoProject || mongoose.model('VideoProject', videoProjectSchema);

export default VideoProject;
export { VideoProject };

