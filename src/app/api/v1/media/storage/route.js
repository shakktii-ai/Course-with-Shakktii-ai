/**
 * AI Academy - Media Storage Usage API
 * GET /api/v1/media/storage
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { MediaAssetService } from '@/services/media-asset.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const usage = await MediaAssetService.getStorageUsage(tenantId);
    return successResponse(usage, 'Storage usage retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetStorageUsage');
  }
}

