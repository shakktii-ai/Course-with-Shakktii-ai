import mongoose from 'mongoose';

const academySettingsSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    enrollmentType: {
      type: String,
      enum: ['OPEN', 'INVITE_ONLY', 'APPROVAL_REQUIRED'],
      default: 'INVITE_ONLY',
    },
    allowSelfRegistration: {
      type: Boolean,
      default: false,
    },
    enforce2FA: {
      type: Boolean,
      default: false,
    },
    defaultLanguage: {
      type: String,
      default: 'en',
    },
    supportedLanguages: {
      type: [String],
      default: ['en', 'hi', 'mr', 'te'],
    },
    certificateAutoIssue: {
      type: Boolean,
      default: true,
    },
    aiFeaturesEnabled: {
      type: Boolean,
      default: true,
    },
    videoGenerationEnabled: {
      type: Boolean,
      default: true,
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

export const AcademySettings =
  mongoose.models.AcademySettings || mongoose.model('AcademySettings', academySettingsSchema);
export default AcademySettings;

