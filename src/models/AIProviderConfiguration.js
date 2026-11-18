import mongoose from 'mongoose';
import { AI_PROVIDER } from '../constants/index.js';

const aiProviderConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: Object.values(AI_PROVIDER),
      default: AI_PROVIDER.GEMINI,
    },
    defaultModel: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    apiKeyEncrypted: {
      type: String,
      default: '',
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    monthlyTokenBudget: {
      type: Number,
      default: 1000000,
    },
    currentMonthTokensUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

aiProviderConfigSchema.index({ tenantId: 1, provider: 1 }, { unique: true });

const AIProviderConfiguration = mongoose.models.AIProviderConfiguration || mongoose.model('AIProviderConfiguration', aiProviderConfigSchema);

export default AIProviderConfiguration;

