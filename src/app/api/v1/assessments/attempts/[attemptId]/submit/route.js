/**
 * AI Academy - Submit Assessment Attempt API
 * POST /api/v1/assessments/attempts/[attemptId]/submit
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { GradingService } from '@/services/grading.service';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { attemptId } = await params;

    const body = await request.json().catch(() => ({}));
    const answers = body.answers || [];

    const result = await GradingService.submitAttempt(tenantId, attemptId, answers, user);
    return successResponse(result, 'Assessment submitted and evaluated successfully');
  } catch (error) {
    return handleApiError(error, 'SubmitAssessmentAttempt');
  }
}

