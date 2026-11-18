import mongoose from 'mongoose';

const sourceReferenceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LessonBlock',
      default: null,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SourceDocument',
      required: true,
      index: true,
    },
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentChunk',
      default: null,
    },
    documentName: {
      type: String,
      required: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    slideNumber: {
      type: Number,
      default: null,
    },
    sourcePassage: {
      type: String,
      required: true,
    },
    claimText: {
      type: String,
      default: '',
    },
    citationRef: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

sourceReferenceSchema.index({ tenantId: 1, courseId: 1, lessonId: 1 });
sourceReferenceSchema.index({ tenantId: 1, documentId: 1 });

const SourceReference = mongoose.models.SourceReference || mongoose.model('SourceReference', sourceReferenceSchema);

export default SourceReference;

