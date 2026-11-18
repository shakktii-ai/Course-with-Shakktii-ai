/**
 * AI Academy - Lesson Details API
 * GET /api/v1/lessons/[id]
 * PATCH /api/v1/lessons/[id]
 * DELETE /api/v1/lessons/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CurriculumService } from '@/services/curriculum.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateLessonSchema = {
  title: { type: 'string', minLength: 2, maxLength: 200 },
  slug: { type: 'string', maxLength: 220 },
  type: { type: 'string' },
  order: { type: 'number' },
  durationMinutes: { type: 'number' },
  description: { type: 'string', maxLength: 2000 },
  isPreview: { type: 'boolean' },
  isMandatory: { type: 'boolean' },
  videoUrl: { type: 'string' },
  videoDuration: { type: 'number' },
  articleContent: { type: 'string' },
};

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const lesson = await CurriculumService.getLessonById(tenantId, id);
    const blocks = await CurriculumService.getBlocks(tenantId, id);

    return successResponse({ ...lesson, blocks }, 'Lesson retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetLesson');
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.LESSON_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateLessonSchema, { throwOnError: true });

    const updated = await CurriculumService.updateLesson(tenantId, id, sanitized, user._id);
    return successResponse(updated, 'Lesson updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateLesson');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.LESSON_DELETE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await CurriculumService.deleteLesson(tenantId, id);
    return successResponse(result, 'Lesson deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteLesson');
  }
}

