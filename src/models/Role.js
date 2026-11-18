import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
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
    slug: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    isPlatformRole: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: A tenant cannot have duplicate role slugs; global platform roles have null tenantId
roleSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);
export default Role;

