import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AnalyticsService } from '@/services/analytics.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ANALYTICS_VIEW,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { id } = await context.params;
    const analytics = await AnalyticsService.getCourseAnalytics(tenantId, id);

    return successResponse(analytics, 'Course funnel analytics retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetCourseFunnelAnalytics');
  }
}

