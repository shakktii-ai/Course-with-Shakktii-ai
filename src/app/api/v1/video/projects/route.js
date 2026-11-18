/**
 * AI Academy - Video Projects Collection API
 * GET /api/v1/video/projects
 * POST /api/v1/video/projects
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoScriptService } from '@/services/video-script.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      lessonId: searchParams.get('lessonId') || undefined,
    };

    const pagination = {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    const result = await VideoScriptService.listProjects(tenantId, filters, pagination);
    return successResponse(result, 'Video projects retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetVideoProjects');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    if (!body.title) {
      throw new BadRequestError('Project title is required');
    }

    const result = await VideoScriptService.generateScriptFromPrompt(
      tenantId,
      {
        title: body.title,
        prompt: body.prompt || body.description || body.title,
        courseId: body.courseId,
        lessonId: body.lessonId,
        targetScenes: body.targetScenes || 3,
        aspectRatio: body.aspectRatio,
        resolution: body.resolution,
        theme: body.theme,
        voiceConfig: body.voiceConfig,
        avatarConfig: body.avatarConfig,
      },
      user
    );

    return successResponse(result.project, 'Video project created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateVideoProject');
  }
}

