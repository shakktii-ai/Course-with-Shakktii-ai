import mongoose from 'mongoose';
import { ORG_STATUS } from '../constants/index.js';

const organizationSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: [
        'EDUCATIONAL_INSTITUTION',
        'COLLEGE_UNIVERSITY',
        'CORPORATE',
        'TRAINING_PROVIDER',
        'ONLINE_ACADEMY',
        'PROFESSIONAL_CERTIFIER',
        'INDIVIDUAL',
      ],
      default: 'CORPORATE',
      index: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: null,
      trim: true,
    },
    contact: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    status: {
      type: String,
      enum: Object.values(ORG_STATUS),
      default: ORG_STATUS.ACTIVE,
      index: true,
    },
    subscriptionTier: {
      type: String,
      default: 'STARTER',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
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

organizationSchema.index({ status: 1, createdAt: -1 });

export const Organization =
  mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
export default Organization;

