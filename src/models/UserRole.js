import mongoose from 'mongoose';

const userRoleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
      index: true,
    },
    roleSlug: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userRoleSchema.index({ tenantId: 1, userId: 1, roleSlug: 1 }, { unique: true });

export const UserRole = mongoose.models.UserRole || mongoose.model('UserRole', userRoleSchema);
export default UserRole;

