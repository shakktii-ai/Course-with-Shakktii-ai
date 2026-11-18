/**
 * AI Academy - Video Project Single Scene API
 * PATCH /api/v1/video/projects/[id]/scenes/[sceneId]
 * DELETE /api/v1/video/projects/[id]/scenes/[sceneId]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoScriptService } from '@/services/video-script.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id, sceneId } = await params;

    const body = await request.json().catch(() => ({}));
    const updated = await VideoScriptService.updateScene(tenantId, id, sceneId, body);

    return successResponse(updated, 'Scene updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateVideoScene');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id, sceneId } = await params;

    const result = await VideoScriptService.deleteScene(tenantId, id, sceneId);
    return successResponse(result, 'Scene deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteVideoScene');
  }
}

