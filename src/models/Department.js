import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    memberCount: {
      type: Number,
      default: 0,
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

departmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });
departmentSchema.index({ tenantId: 1, code: 1 }, { sparse: true });

export const Department =
  mongoose.models.Department || mongoose.model('Department', departmentSchema);
export default Department;

