/**
 * AI Academy - Video Script Generation API
 * POST /api/v1/video/scripts/generate
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoScriptService } from '@/services/video-script.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { mode, lessonId, ...payload } = body;

    let result;
    if (mode === 'lesson' || lessonId) {
      if (!lessonId) {
        throw new BadRequestError('lessonId is required when mode is lesson');
      }
      result = await VideoScriptService.generateScriptFromLesson(tenantId, lessonId, payload, user);
    } else {
      result = await VideoScriptService.generateScriptFromPrompt(tenantId, payload, user);
    }

    return successResponse(result, 'Video script generated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'GenerateVideoScript');
  }
}

