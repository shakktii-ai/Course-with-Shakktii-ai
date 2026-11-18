/**
 * AI Academy - Video Project Scenes Collection API
 * POST /api/v1/video/projects/[id]/scenes (Add Scene)
 * PUT /api/v1/video/projects/[id]/scenes (Reorder Scenes)
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoScriptService } from '@/services/video-script.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const result = await VideoScriptService.addScene(tenantId, id, body);

    return successResponse(result, 'Scene added to project', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'AddVideoScene');
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.sceneIds)) {
      throw new BadRequestError('sceneIds array is required for reordering');
    }

    const scenes = await VideoScriptService.reorderScenes(tenantId, id, body.sceneIds);
    return successResponse(scenes, 'Scenes reordered successfully');
  } catch (error) {
    return handleApiError(error, 'ReorderVideoScenes');
  }
}

