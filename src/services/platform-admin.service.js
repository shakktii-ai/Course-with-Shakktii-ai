import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Academy from '../models/Academy.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Certificate from '../models/Certificate.js';
import MediaAsset from '../models/MediaAsset.js';
import AIUsageRecord from '../models/AIUsageRecord.js';
import AuditLog from '../models/AuditLog.js';
import OrganizationSubscription from '../models/OrganizationSubscription.js';
import PlatformMetricSnapshot from '../models/PlatformMetricSnapshot.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { SUBSCRIPTION_TIER, SUBSCRIPTION_STATUS, ORG_STATUS } from '../constants/index.js';

export class PlatformAdminService extends BaseService {
  constructor() {
    super(Organization);
  }

  /**
   * Module 08.1: Global SaaS Executive Metrics
   */
  static async getGlobalMetrics() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalAcademies,
      totalCourses,
      totalEnrollments,
      totalCertificatesIssued,
      storageAgg,
      aiTokenAgg,
      subscriptions,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: ORG_STATUS.ACTIVE }),
      User.countDocuments(),
      Academy.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Certificate.countDocuments(),
      MediaAsset.aggregate([
        { $group: { _id: null, totalBytes: { $sum: '$sizeBytes' } } },
      ]),
      AIUsageRecord.aggregate([
        { $group: { _id: null, totalTokens: { $sum: '$totalTokens' } } },
      ]),
      OrganizationSubscription.find({ status: SUBSCRIPTION_STATUS.ACTIVE }).lean(),
    ]);

    const totalStorageBytes = storageAgg[0]?.totalBytes || 0;
    const totalTokensUsed = aiTokenAgg[0]?.totalTokens || 0;

    // Calculate MRR and tier distribution
    let mrr = 0;
    const tierCounts = {
      FREE: 0,
      STARTER: 0,
      PRO: 0,
      ENTERPRISE: 0,
    };

    for (const sub of subscriptions) {
      const monthlyAmount = sub.billingCycle === 'ANNUAL' ? sub.amount / 12 : sub.amount;
      mrr += monthlyAmount || 0;
      if (tierCounts[sub.tier] !== undefined) {
        tierCounts[sub.tier]++;
      }
    }

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalAcademies,
      totalCourses,
      totalEnrollments,
      totalCertificatesIssued,
      totalStorageBytes,
      totalTokensUsed,
      estimatedMrr: Math.round(mrr),
      activeSubscriptionsCount: subscriptions.length,
      tierDistribution: tierCounts,
    };
  }

  /**
   * Module 08.1: Paginated Tenant Directory with Quotas & Resource Footprints
   */
  static async getTenantList(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(query.page || 1, 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      Organization.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'name email')
        .lean(),
      Organization.countDocuments(filter),
    ]);

    // Enrich with subscriptions and usage counts
    const enrichedTenants = await Promise.all(
      tenants.map(async (tenant) => {
        const [subscription, userCount, courseCount] = await Promise.all([
          OrganizationSubscription.findOne({ tenantId: tenant._id }).lean(),
          User.countDocuments({ tenantId: tenant._id }),
          Course.countDocuments({ tenantId: tenant._id }),
        ]);

        return {
          ...tenant,
          subscription: subscription || {
            tier: tenant.subscriptionTier || SUBSCRIPTION_TIER.STARTER,
            status: SUBSCRIPTION_STATUS.ACTIVE,
          },
          metrics: {
            userCount,
            courseCount,
          },
        };
      })
    );

    return {
      items: enrichedTenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Deep-dive Tenant Details & Resource Audit
   */
  static async getTenantDetails(tenantId) {
    const tenant = await Organization.findOne({ _id: tenantId })
      .populate('ownerId', 'name email role')
      .lean();

    if (!tenant) {
      throw new NotFoundError('Organization not found');
    }

    const [subscription, userCount, courseCount, academyCount, storageAgg, tokenAgg] =
      await Promise.all([
        OrganizationSubscription.findOne({ tenantId }).lean(),
        User.countDocuments({ tenantId }),
        Course.countDocuments({ tenantId }),
        Academy.countDocuments({ tenantId }),
        MediaAsset.aggregate([
          { $match: { tenantId: tenant._id } },
          { $group: { _id: null, totalBytes: { $sum: '$sizeBytes' } } },
        ]),
        AIUsageRecord.aggregate([
          { $match: { tenantId: tenant._id } },
          { $group: { _id: null, totalTokens: { $sum: '$totalTokens' } } },
        ]),
      ]);

    return {
      organization: tenant,
      subscription: subscription || {
        tier: tenant.subscriptionTier || SUBSCRIPTION_TIER.STARTER,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        quotas: {
          maxUsers: 50,
          maxCourses: 10,
          maxStorageBytes: 1024 * 1024 * 1024 * 10,
          monthlyAITokenBudget: 500000,
        },
      },
      metrics: {
        userCount,
        courseCount,
        academyCount,
        storageBytes: storageAgg[0]?.totalBytes || 0,
        tokensUsed: tokenAgg[0]?.totalTokens || 0,
      },
    };
  }

  /**
   * Suspend or Reactivate an Organization
   */
  static async updateTenantStatus(tenantId, status, reason = '') {
    if (!Object.values(ORG_STATUS).includes(status)) {
      throw new BadRequestError(`Invalid organization status: ${status}`);
    }

    const tenant = await Organization.findOneAndUpdate(
      { _id: tenantId },
      { $set: { status } },
      { new: true }
    );

    if (!tenant) {
      throw new NotFoundError('Organization not found');
    }

    // Update subscription status if suspended
    if (status === ORG_STATUS.SUSPENDED) {
      await OrganizationSubscription.updateOne(
        { tenantId },
        { $set: { status: SUBSCRIPTION_STATUS.PAST_DUE } }
      );
    } else if (status === ORG_STATUS.ACTIVE) {
      await OrganizationSubscription.updateOne(
        { tenantId },
        { $set: { status: SUBSCRIPTION_STATUS.ACTIVE } }
      );
    }

    return tenant;
  }

  /**
   * Update Tenant Subscription Tier & Quotas
   */
  static async updateTenantSubscription(tenantId, data = {}) {
    const {
      tier = SUBSCRIPTION_TIER.STARTER,
      status = SUBSCRIPTION_STATUS.ACTIVE,
      billingCycle = 'MONTHLY',
      amount = 49,
      quotas = {},
    } = data;

    const defaultQuotasByTier = {
      FREE: {
        maxUsers: 10,
        maxCourses: 2,
        maxStorageBytes: 1024 * 1024 * 1024 * 1, // 1 GB
        monthlyAITokenBudget: 50000,
      },
      STARTER: {
        maxUsers: 50,
        maxCourses: 10,
        maxStorageBytes: 1024 * 1024 * 1024 * 10, // 10 GB
        monthlyAITokenBudget: 500000,
      },
      PRO: {
        maxUsers: 500,
        maxCourses: 100,
        maxStorageBytes: 1024 * 1024 * 1024 * 100, // 100 GB
        monthlyAITokenBudget: 5000000,
      },
      ENTERPRISE: {
        maxUsers: -1,
        maxCourses: -1,
        maxStorageBytes: 1024 * 1024 * 1024 * 1024, // 1 TB
        monthlyAITokenBudget: 50000000,
      },
    };

    const resolvedQuotas = {
      ...(defaultQuotasByTier[tier] || defaultQuotasByTier.STARTER),
      ...quotas,
    };

    const subscription = await OrganizationSubscription.findOneAndUpdate(
      { tenantId },
      {
        $set: {
          tier,
          status,
          billingCycle,
          amount,
          quotas: resolvedQuotas,
        },
      },
      { upsert: true, new: true }
    );

    // Sync Organization model tier
    await Organization.updateOne({ _id: tenantId }, { $set: { subscriptionTier: tier } });

    return subscription;
  }

  /**
   * Record Daily Platform Metric Snapshot for Historical Analytics
   */
  static async recordPlatformSnapshot() {
    const metrics = await this.getGlobalMetrics();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await PlatformMetricSnapshot.findOneAndUpdate(
      { date: today },
      {
        $set: {
          totalTenants: metrics.totalTenants,
          activeTenants: metrics.activeTenants,
          totalUsers: metrics.totalUsers,
          totalCourses: metrics.totalCourses,
          totalEnrollments: metrics.totalEnrollments,
          totalCertificatesIssued: metrics.totalCertificatesIssued,
          totalRevenue: metrics.estimatedMrr,
          totalTokensUsed: metrics.totalTokensUsed,
          totalStorageBytes: metrics.totalStorageBytes,
          breakdownByTier: metrics.tierDistribution,
        },
      },
      { upsert: true, new: true }
    );

    return snapshot;
  }
}

export default PlatformAdminService;

