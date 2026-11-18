import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { PlatformAdminService } from '@/services/platform-admin.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await authenticateRequest(request, {
      permissions: PERMISSIONS.PLATFORM_MANAGE,
    });

    const metrics = await PlatformAdminService.getGlobalMetrics();
    return successResponse(metrics, 'Global SaaS metrics retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetPlatformMetrics');
  }
}

