import mongoose from 'mongoose';
import { SOURCE_DOC_STATUS } from '../constants/index.js';

const sourceDocumentSchema = new mongoose.Schema(
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
    originalFilename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    storageKey: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(SOURCE_DOC_STATUS),
      default: SOURCE_DOC_STATUS.PENDING,
      index: true,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    extractedSummary: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

sourceDocumentSchema.index({ tenantId: 1, status: 1 });
sourceDocumentSchema.index({ tenantId: 1, fileType: 1 });

const SourceDocument = mongoose.models.SourceDocument || mongoose.model('SourceDocument', sourceDocumentSchema);

export default SourceDocument;
export { SourceDocument };


