import mongoose from 'mongoose';
import { TUTOR_MESSAGE_SENDER } from '../constants/index.js';

const citationSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SourceDocument',
      default: null,
    },
    documentName: {
      type: String,
      default: 'Course Source',
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentChunk',
      default: null,
    },
    sourcePassage: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    citationRef: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const tutorMessageSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorConversation',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: Object.values(TUTOR_MESSAGE_SENDER),
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: {
      type: [citationSchema],
      default: [],
    },
    hintLevel: {
      type: Number,
      default: null,
      min: 1,
      max: 4,
    },
    isGrounded: {
      type: Boolean,
      default: true,
    },
    tokensUsed: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
    },
    sentiment: {
      type: String,
      enum: ['POSITIVE', 'NEUTRAL', 'CONFUSED', 'FRUSTRATED'],
      default: 'NEUTRAL',
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flagReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

tutorMessageSchema.index({ tenantId: 1, conversationId: 1, createdAt: 1 });

const TutorMessage =
  mongoose.models.TutorMessage ||
  mongoose.model('TutorMessage', tutorMessageSchema);

export default TutorMessage;
export { TutorMessage };

