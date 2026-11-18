import mongoose from 'mongoose';

const sourceDocumentVersionSchema = new mongoose.Schema(
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
    versionNumber: {
      type: Number,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    storageKey: {
      type: String,
      default: '',
    },
    changelog: {
      type: String,
      default: 'Document revision uploaded',
    },
    chunkCount: {
      type: Number,
      default: 0,
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

sourceDocumentVersionSchema.index({ tenantId: 1, documentId: 1, versionNumber: 1 }, { unique: true });

const SourceDocumentVersion = mongoose.models.SourceDocumentVersion || mongoose.model('SourceDocumentVersion', sourceDocumentVersionSchema);

export default SourceDocumentVersion;

