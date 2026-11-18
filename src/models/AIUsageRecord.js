import mongoose from 'mongoose';

const aiUsageRecordSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskType: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    estimatedCostUsd: {
      type: Number,
      default: 0,
    },
    associatedCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

aiUsageRecordSchema.index({ tenantId: 1, createdAt: -1 });
aiUsageRecordSchema.index({ tenantId: 1, taskType: 1 });

const AIUsageRecord = mongoose.models.AIUsageRecord || mongoose.model('AIUsageRecord', aiUsageRecordSchema);

export default AIUsageRecord;
export { AIUsageRecord };


