/**
 * AI Academy - Single Video Clip Breakdown API
 * GET /api/v1/video-clips/[id]
 * PATCH /api/v1/video-clips/[id] (Fine-tune clip start/end timestamps)
 * DELETE /api/v1/video-clips/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoClipAnalyzerService } from '@/services/video-clip-analyzer.service';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const breakdown = await VideoClipAnalyzerService.getBreakdownById(tenantId, id);
    return successResponse(breakdown, 'Video clip breakdown fetched');
  } catch (error) {
    return handleApiError(error, 'GetVideoClipBreakdown');
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    if (!body.clipId) {
      throw new BadRequestError('clipId is required');
    }

    const isAdmin =
      user.roles?.includes('ORG_ADMIN') ||
      user.roles?.includes('INSTRUCTOR') ||
      user.role === 'SUPER_ADMIN';

    const updated = await VideoClipAnalyzerService.updateClipTiming(
      tenantId,
      id,
      body.clipId,
      body.startSeconds,
      body.endSeconds,
      user._id,
      isAdmin
    );

    return successResponse(updated, 'Clip timing updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateVideoClipTiming');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const isAdmin =
      user.roles?.includes('ORG_ADMIN') ||
      user.roles?.includes('INSTRUCTOR') ||
      user.role === 'SUPER_ADMIN';

    const result = await VideoClipAnalyzerService.deleteBreakdown(tenantId, id, user._id, isAdmin);
    return successResponse(result, 'Video clip breakdown deleted');
  } catch (error) {
    return handleApiError(error, 'DeleteVideoClipBreakdown');
  }
}
