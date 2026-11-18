/**
 * AI Academy - Video Rendering Status API
 * GET /api/v1/video/projects/[id]/status
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoRenderingService } from '@/services/video-rendering.service';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const status = await VideoRenderingService.getRenderingStatus(tenantId, id);
    return successResponse(status, 'Rendering status retrieved');
  } catch (error) {
    return handleApiError(error, 'GetVideoRenderingStatus');
  }
}

