import mongoose from 'mongoose';
import { VOICE_PROVIDER, VOICE_GENDER } from '../constants/index.js';

const voiceProfileSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    voiceId: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: Object.values(VOICE_PROVIDER),
      default: VOICE_PROVIDER.MOCK,
      index: true,
    },
    language: {
      type: String,
      default: 'en',
      index: true,
    },
    languageName: {
      type: String,
      default: 'English',
    },
    gender: {
      type: String,
      enum: Object.values(VOICE_GENDER),
      default: VOICE_GENDER.NEUTRAL,
    },
    sampleAudioUrl: {
      type: String,
      default: '',
    },
    isSystemDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    settings: {
      speedRate: { type: Number, default: 1.0 },
      pitch: { type: Number, default: 1.0 },
      stability: { type: Number, default: 0.75 },
      style: { type: String, default: 'neutral' },
    },
  },
  {
    timestamps: true,
  }
);

voiceProfileSchema.index({ tenantId: 1, provider: 1 });
voiceProfileSchema.index({ language: 1, isSystemDefault: 1 });

const VoiceProfile = mongoose.models.VoiceProfile || mongoose.model('VoiceProfile', voiceProfileSchema);

export default VoiceProfile;
export { VoiceProfile };

