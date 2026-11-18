import mongoose from 'mongoose';

const academySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    faviconUrl: {
      type: String,
      default: null,
    },
    tagline: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    theme: {
      primaryColor: { type: String, default: '#059669' },
      secondaryColor: { type: String, default: '#0f172a' },
      accentColor: { type: String, default: '#34d399' },
      mode: { type: String, enum: ['light', 'dark'], default: 'light' },
    },
    subdomain: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    customDomain: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    landingPage: {
      heroTitle: { type: String, default: 'Welcome to our Academy' },
      heroSubtitle: { type: String, default: 'AI-powered, industry-relevant curriculum' },
      bannerUrl: { type: String, default: null },
      features: [
        {
          title: String,
          description: String,
          icon: String,
        },
      ],
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

export const Academy = mongoose.models.Academy || mongoose.model('Academy', academySchema);
export default Academy;

