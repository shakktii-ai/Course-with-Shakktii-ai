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

    const overview = await AnalyticsService.getOrganizationOverview(tenantId);
    return successResponse(overview, 'Organization analytics overview retrieved');
  } catch (error) {
    return handleApiError(error, 'GetOrganizationOverview');
  }
}

