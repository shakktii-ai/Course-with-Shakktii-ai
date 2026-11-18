/**
 * AI Academy - AI Token Usage & Cost Analytics API
 * GET /api/v1/ai/usage
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import AIUsageRecord from '@/models/AIUsageRecord';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ANALYTICS_VIEW,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const records = await AIUsageRecord.find({ tenantId })
      .populate('userId', 'name email')
      .populate('associatedCourseId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const totalTokens = records.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
    const totalCostUsd = records.reduce((sum, r) => sum + (r.estimatedCostUsd || 0), 0);

    return successResponse(
      {
        totalRecords: records.length,
        totalTokens,
        totalCostUsd: Number(totalCostUsd.toFixed(4)),
        records,
      },
      'AI usage records retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error, 'GetAIUsage');
  }
}

