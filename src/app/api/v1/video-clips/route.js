/**
 * AI Academy - List Video Clip Breakdowns API
 * GET /api/v1/video-clips
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoClipAnalyzerService } from '@/services/video-clip-analyzer.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const url = new URL(request.url);
    const scope = url.searchParams.get('scope');
    const isAdmin =
      scope === 'all' &&
      (user.roles?.includes('ORG_ADMIN') ||
        user.roles?.includes('INSTRUCTOR') ||
        user.role === 'SUPER_ADMIN');

    const breakdowns = await VideoClipAnalyzerService.listBreakdowns(tenantId, user._id, isAdmin);
    return successResponse(breakdowns, 'Video clip breakdowns loaded');
  } catch (error) {
    return handleApiError(error, 'ListVideoClipBreakdowns');
  }
}
