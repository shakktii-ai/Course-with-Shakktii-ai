import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { PLATFORM_ROLES, USER_STATUS } from '../constants/index.js';

const platformUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Do not return password by default in queries
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(PLATFORM_ROLES),
      default: PLATFORM_ROLES.PLATFORM_ADMIN,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password securely
platformUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const PlatformUser =
  mongoose.models.PlatformUser || mongoose.model('PlatformUser', platformUserSchema);
export default PlatformUser;

