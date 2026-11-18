import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AnalyticsService } from '@/services/analytics.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ANALYTICS_VIEW,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const thresholdDays = parseInt(searchParams.get('thresholdDays') || '14', 10);

    const atRisk = await AnalyticsService.getAtRiskLearners(tenantId, thresholdDays);
    return successResponse(atRisk, 'At-risk learners retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetAtRiskLearners');
  }
}

