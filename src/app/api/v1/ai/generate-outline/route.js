/**
 * AI Academy - Generate Course Outline API
 * POST /api/v1/ai/generate-outline
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { AICourseGeneratorService } from '@/services/ai-course-generator.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const outlineSchema = {
  brief: { type: 'object', required: true },
  sourceDocumentIds: { type: 'array' },
};

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AI_GENERATE_COURSE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, outlineSchema, { throwOnError: true });

    const result = await AICourseGeneratorService.generateOutline(
      tenantId,
      sanitized.brief,
      sanitized.sourceDocumentIds || [],
      user._id
    );

    return successResponse(result, 'Course outline generated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'GenerateOutline');
  }
}

