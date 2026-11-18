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

    const { searchParams } = new URL(request.url);
    const query = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    const result = await PlatformAdminService.getTenantList(query);
    return successResponse(result, 'Platform organizations retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetPlatformTenants');
  }
}

