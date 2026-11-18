import mongoose from 'mongoose';
import { SUBSCRIPTION_TIER, SUBSCRIPTION_STATUS } from '../constants/index.js';

const organizationSubscriptionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    tier: {
      type: String,
      enum: Object.values(SUBSCRIPTION_TIER),
      default: SUBSCRIPTION_TIER.STARTER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'ANNUAL'],
      default: 'MONTHLY',
    },
    amount: {
      type: Number,
      default: 49,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    quotas: {
      maxUsers: { type: Number, default: 50 }, // -1 for unlimited
      maxCourses: { type: Number, default: 10 },
      maxStorageBytes: { type: Number, default: 1024 * 1024 * 1024 * 10 }, // 10 GB
      monthlyAITokenBudget: { type: Number, default: 500000 }, // 500k tokens
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

organizationSubscriptionSchema.index({ tenantId: 1, status: 1 });
organizationSubscriptionSchema.index({ tier: 1, status: 1 });

const OrganizationSubscription =
  mongoose.models.OrganizationSubscription ||
  mongoose.model('OrganizationSubscription', organizationSubscriptionSchema);

export default OrganizationSubscription;
export { OrganizationSubscription };

