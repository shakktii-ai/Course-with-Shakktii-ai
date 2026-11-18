/**
 * AI Academy - Assessment Attempt Details API
 * GET /api/v1/assessments/attempts/[attemptId]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { GradingService } from '@/services/grading.service';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { attemptId } = await params;

    const result = await GradingService.getAttemptById(tenantId, attemptId, user);
    return successResponse(result, 'Attempt details retrieved');
  } catch (error) {
    return handleApiError(error, 'GetAssessmentAttempt');
  }
}

