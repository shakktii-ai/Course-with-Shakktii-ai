/**
 * AI Academy - AI Assessment Generator API
 * POST /api/v1/assessments/generate
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AIAssessmentGeneratorService } from '@/services/ai-assessment-generator.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ASSESSMENT_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { mode, lessonId, ...payload } = body;

    let result;
    if (mode === 'lesson' || lessonId) {
      if (!lessonId) {
        throw new BadRequestError('lessonId is required when generating from lesson');
      }
      result = await AIAssessmentGeneratorService.generateQuizFromLesson(tenantId, lessonId, payload, user);
    } else {
      result = await AIAssessmentGeneratorService.generateQuizFromPrompt(tenantId, payload, user);
    }

    return successResponse(result, 'AI Assessment generated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'GenerateAIAssessment');
  }
}

