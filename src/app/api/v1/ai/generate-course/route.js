/**
 * AI Academy - Generate Complete Course API
 * POST /api/v1/ai/generate-course
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { AICourseGeneratorService } from '@/services/ai-course-generator.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const courseGenSchema = {
  brief: { type: 'object', required: true },
  outline: { type: 'object', required: true },
  sourceDocumentIds: { type: 'array' },
};

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AI_GENERATE_COURSE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, courseGenSchema, { throwOnError: true });

    const result = await AICourseGeneratorService.generateFullCourse(
      tenantId,
      {
        brief: sanitized.brief,
        outline: sanitized.outline,
        sourceDocumentIds: sanitized.sourceDocumentIds || [],
      },
      user._id
    );

    return successResponse(result, result.message, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'GenerateFullCourse');
  }
}

