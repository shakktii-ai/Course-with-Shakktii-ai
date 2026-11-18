import mongoose from 'mongoose';
import { MEDIA_TYPE } from '../constants/index.js';

const mediaAssetSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: Object.values(MEDIA_TYPE),
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    resolution: {
      type: String,
      default: '',
    },
    associatedProjectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VideoProject',
      },
    ],
    associatedCourseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    associatedLessonIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

mediaAssetSchema.index({ tenantId: 1, mediaType: 1 });
mediaAssetSchema.index({ tenantId: 1, createdAt: -1 });

const MediaAsset = mongoose.models.MediaAsset || mongoose.model('MediaAsset', mediaAssetSchema);

export default MediaAsset;
export { MediaAsset };

