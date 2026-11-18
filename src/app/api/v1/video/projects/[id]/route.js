/**
 * AI Academy - Video Project By ID API
 * GET /api/v1/video/projects/[id]
 * PATCH /api/v1/video/projects/[id]
 * DELETE /api/v1/video/projects/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoScriptService } from '@/services/video-script.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await VideoScriptService.getProjectWithScenes(tenantId, id);
    return successResponse(result, 'Video project retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetVideoProject');
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const updated = await VideoScriptService.updateProject(tenantId, id, body, user);

    return successResponse(updated, 'Video project updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateVideoProject');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_DELETE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await VideoScriptService.deleteProject(tenantId, id);
    return successResponse(result, 'Video project and scenes deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteVideoProject');
  }
}

