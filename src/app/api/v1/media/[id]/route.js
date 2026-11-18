/**
 * AI Academy - Media Asset By ID API
 * GET /api/v1/media/[id]
 * DELETE /api/v1/media/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { MediaAssetService } from '@/services/media-asset.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const asset = await MediaAssetService.getMediaAssetById(tenantId, id);
    return successResponse(asset, 'Media asset retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetMediaAsset');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_DELETE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await MediaAssetService.deleteMediaAsset(tenantId, id);
    return successResponse(result, 'Media asset deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteMediaAsset');
  }
}

