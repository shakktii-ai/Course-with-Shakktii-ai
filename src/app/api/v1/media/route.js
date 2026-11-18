/**
 * AI Academy - Media Library Collection API
 * GET /api/v1/media
 * POST /api/v1/media
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { MediaAssetService } from '@/services/media-asset.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      mediaType: searchParams.get('mediaType') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      courseId: searchParams.get('courseId') || undefined,
    };

    const pagination = {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    const result = await MediaAssetService.listMediaAssets(tenantId, filters, pagination);
    return successResponse(result, 'Media assets retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetMediaAssets');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const asset = await MediaAssetService.createMediaAsset(tenantId, body, user);

    return successResponse(asset, 'Media asset created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateMediaAsset');
  }
}

