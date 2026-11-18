import mongoose from 'mongoose';

const organizationMembershipSchema = new mongoose.Schema(
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
    roles: [
      {
        type: String,
        trim: true,
        uppercase: true,
        default: ['STUDENT'],
      },
    ],
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    groupIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'INVITED'],
      default: 'ACTIVE',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
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

organizationMembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
organizationMembershipSchema.index({ tenantId: 1, departmentId: 1 });
organizationMembershipSchema.index({ tenantId: 1, status: 1 });

export const OrganizationMembership =
  mongoose.models.OrganizationMembership ||
  mongoose.model('OrganizationMembership', organizationMembershipSchema);
export default OrganizationMembership;

