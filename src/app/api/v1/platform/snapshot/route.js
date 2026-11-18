import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { PlatformAdminService } from '@/services/platform-admin.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await authenticateRequest(request, {
      permissions: PERMISSIONS.PLATFORM_MANAGE,
    });

    const snapshot = await PlatformAdminService.recordPlatformSnapshot();
    return successResponse(snapshot, 'Platform snapshot recorded', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'RecordPlatformSnapshot');
  }
}

