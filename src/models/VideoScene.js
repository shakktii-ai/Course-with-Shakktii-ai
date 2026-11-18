import mongoose from 'mongoose';
import { SCENE_VISUAL_TYPE } from '../constants/index.js';

const videoSceneSchema = new mongoose.Schema(
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
    sceneOrder: {
      type: Number,
      required: true,
      default: 1,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    narrationText: {
      type: String,
      required: true,
      trim: true,
    },
    visualType: {
      type: String,
      enum: Object.values(SCENE_VISUAL_TYPE),
      default: SCENE_VISUAL_TYPE.SLIDE,
    },
    visualContent: {
      headline: { type: String, default: '' },
      bullets: [{ type: String }],
      codeSnippet: { type: String, default: '' },
      codeLanguage: { type: String, default: 'javascript' },
      imageUrl: { type: String, default: '' },
      layoutTemplate: { type: String, default: 'standard-bullets' },
      highlightPhrase: { type: String, default: '' },
      accentColor: { type: String, default: '#059669' },
    },
    durationSeconds: {
      type: Number,
      default: 5,
      min: 1,
    },
    audioAssetUrl: {
      type: String,
      default: '',
    },
    renderedFrameUrl: {
      type: String,
      default: '',
    },
    teleprompterNotes: {
      type: String,
      default: '',
    },
    transition: {
      type: String,
      enum: ['fade', 'slide-left', 'zoom', 'cut'],
      default: 'fade',
    },
  },
  {
    timestamps: true,
  }
);

videoSceneSchema.index({ tenantId: 1, projectId: 1, sceneOrder: 1 });

const VideoScene = mongoose.models.VideoScene || mongoose.model('VideoScene', videoSceneSchema);

export default VideoScene;
export { VideoScene };

