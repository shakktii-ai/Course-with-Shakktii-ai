/**
 * AI Academy - AI Content Editor / Rewrite API
 * POST /api/v1/ai/rewrite
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { AICourseGeneratorService } from '@/services/ai-course-generator.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const rewriteSchema = {
  content: { type: 'string', required: true },
  mode: { type: 'string', required: true }, // 'REWRITE', 'SIMPLIFY', 'EXPAND', 'SUMMARIZE', 'TRANSLATE', 'QUIZ'
  language: { type: 'string' },
};

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AI_GENERATE_LESSON,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, rewriteSchema, { throwOnError: true });

    const result = await AICourseGeneratorService.transformContent(
      tenantId,
      sanitized,
      user._id
    );

    return successResponse(result, 'Content transformed successfully');
  } catch (error) {
    return handleApiError(error, 'TransformContent');
  }
}

