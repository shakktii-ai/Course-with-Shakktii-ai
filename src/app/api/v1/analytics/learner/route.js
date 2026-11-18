import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AnalyticsService } from '@/services/analytics.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const personal = await AnalyticsService.getLearnerPersonalAnalytics(tenantId, user._id);
    return successResponse(personal, 'Personal learner analytics retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetLearnerPersonalAnalytics');
  }
}

