import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
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
      default: 1,
    },
    chunkIndex: {
      type: Number,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    slideNumber: {
      type: Number,
      default: null,
    },
    sectionTitle: {
      type: String,
      default: '',
    },
    embedding: {
      type: [Number],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

documentChunkSchema.index({ tenantId: 1, documentId: 1, chunkIndex: 1 });
documentChunkSchema.index({ tenantId: 1, documentId: 1, versionNumber: 1 });

const DocumentChunk = mongoose.models.DocumentChunk || mongoose.model('DocumentChunk', documentChunkSchema);

export default DocumentChunk;
export { DocumentChunk };


