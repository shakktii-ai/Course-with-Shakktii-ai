import mongoose from 'mongoose';

const clipQuizSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    options: [{ type: String }],
    correctIndex: { type: Number, default: 0 },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const videoClipItemSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    startSeconds: { type: Number, required: true, min: 0 },
    endSeconds: { type: Number, required: true, min: 1 },
    startTimeFormatted: { type: String, default: '00:00' },
    endTimeFormatted: { type: String, default: '00:30' },
    durationSeconds: { type: Number, default: 30 },
    clipUrl: { type: String, default: '' },
    downloadUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    shortSummary: { type: String, default: '' },
    detailedExplanation: { type: String, default: '' },
    keyTakeaways: [{ type: String }],
    realWorldExample: { type: String, default: '' },
    transcriptSnippet: { type: String, default: '' },
    quiz: { type: clipQuizSchema, default: null },
  },
  { _id: true }
);

const videoClipBreakdownSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      enum: ['English', 'Marathi', 'Hindi', 'Marathi-English'],
      default: 'Marathi-English',
    },
    clipStyle: {
      type: String,
      enum: ['AUTO', 'SHORT', 'CHAPTERS'],
      default: 'AUTO',
    },
    sourceVideoUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    videoSummary: {
      type: String,
      default: '',
    },
    overallTopics: [{ type: String }],
    clips: [videoClipItemSchema],
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

videoClipBreakdownSchema.index({ tenantId: 1, createdBy: 1, createdAt: -1 });

export const VideoClipBreakdown =
  mongoose.models.VideoClipBreakdown ||
  mongoose.model('VideoClipBreakdown', videoClipBreakdownSchema);

export default VideoClipBreakdown;
