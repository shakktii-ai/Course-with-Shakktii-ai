import mongoose from 'mongoose';

const aiGenerationVersionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIGenerationJob',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    prompt: {
      type: String,
      default: '',
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
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

aiGenerationVersionSchema.index({ tenantId: 1, jobId: 1, versionNumber: 1 }, { unique: true });

const AIGenerationVersion = mongoose.models.AIGenerationVersion || mongoose.model('AIGenerationVersion', aiGenerationVersionSchema);

export default AIGenerationVersion;

