/**
 * AI Academy - Module Lessons API
 * GET /api/v1/modules/[id]/lessons
 * POST /api/v1/modules/[id]/lessons
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CurriculumService } from '@/services/curriculum.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import Module from '@/models/Module';
import { NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const lessonSchema = {
  title: { type: 'string', required: true, minLength: 2, maxLength: 200 },
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

    const lessons = await CurriculumService.getLessons(tenantId, id);
    return successResponse(lessons, 'Module lessons retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetLessons');
  }
}

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.LESSON_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const targetModule = await Module.findOne({ _id: id, tenantId });
    if (!targetModule) {
      throw new NotFoundError('Target module not found');
    }

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, lessonSchema, { throwOnError: true });

    const newLesson = await CurriculumService.createLesson(
      tenantId,
      targetModule.courseId,
      id,
      sanitized,
      user._id
    );

    return successResponse(newLesson, 'Lesson created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateLesson');
  }
}

