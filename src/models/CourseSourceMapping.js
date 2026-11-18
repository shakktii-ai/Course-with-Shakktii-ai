import mongoose from 'mongoose';

const courseSourceMappingSchema = new mongoose.Schema(
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
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SourceDocument',
      required: true,
      index: true,
    },
    sourceVersionAtGeneration: {
      type: Number,
      default: 1,
    },
    isSynced: {
      type: Boolean,
      default: true,
      index: true,
    },
    pendingChangeReport: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

courseSourceMappingSchema.index({ tenantId: 1, courseId: 1, documentId: 1 }, { unique: true });

const CourseSourceMapping = mongoose.models.CourseSourceMapping || mongoose.model('CourseSourceMapping', courseSourceMappingSchema);

export default CourseSourceMapping;
export { CourseSourceMapping };


