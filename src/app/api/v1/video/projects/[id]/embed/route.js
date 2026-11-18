/**
 * AI Academy - Embed Video in LMS Lesson API
 * POST /api/v1/video/projects/[id]/embed
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoRenderingService } from '@/services/video-rendering.service';
import { PERMISSIONS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.LESSON_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const lessonId = body.lessonId;
    if (!lessonId) {
      throw new BadRequestError('lessonId is required to embed video');
    }

    const result = await VideoRenderingService.embedVideoInLesson(tenantId, id, lessonId, body, user);
    return successResponse(result, 'Video successfully embedded into LMS lesson');
  } catch (error) {
    return handleApiError(error, 'EmbedVideoInLesson');
  }
}

