/**
 * AI Academy - Lesson Content Blocks API
 * GET /api/v1/lessons/[id]/blocks
 * POST /api/v1/lessons/[id]/blocks
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CurriculumService } from '@/services/curriculum.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import Lesson from '@/models/Lesson';
import { NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const blockSchema = {
  type: { type: 'string', required: true },
  title: { type: 'string', maxLength: 200 },
  order: { type: 'number' },
  content: { type: 'object' },
  metadata: { type: 'object' },
  isOptional: { type: 'boolean' },
};

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const blocks = await CurriculumService.getBlocks(tenantId, id);
    return successResponse(blocks, 'Lesson blocks retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetLessonBlocks');
  }
}

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.LESSON_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const lesson = await Lesson.findOne({ _id: id, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, blockSchema, { throwOnError: true });

    const newBlock = await CurriculumService.createBlock(
      tenantId,
      lesson.courseId,
      id,
      sanitized,
      user._id
    );

    return successResponse(newBlock, 'Content block added successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateLessonBlock');
  }
}

